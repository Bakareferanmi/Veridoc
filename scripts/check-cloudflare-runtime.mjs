import { Miniflare } from "miniflare";
import { readdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const serverRoot = path.join(root, "dist/server");
const moduleNames = [
  "index.js",
  ...readdirSync(serverRoot, { recursive: true }).filter(
    (name) => name.endsWith(".js") && name !== "index.js",
  ),
];
const mf = new Miniflare({
  modules: moduleNames.map((name) => ({
    type: "ESModule",
    path: path.join(serverRoot, name),
  })),
  modulesRoot: serverRoot,
  compatibilityDate: "2026-05-15",
  compatibilityFlags: ["nodejs_compat"],
  d1Databases: { DB: "veridoc-isolated-runtime-check" },
  bindings: {
    VERIDOC_AUTH_MODE: "standalone",
    APP_ORIGIN: "https://veridoc.test",
    BETTER_AUTH_SECRET: "local-runtime-test-key-with-more-than-32-characters",
  },
});
try {
  const db = await mf.getD1Database("DB");
  for (const name of readdirSync(path.join(root, "drizzle"))
    .filter((name) => name.endsWith(".sql"))
    .sort()) {
    for (const statement of readFileSync(
      path.join(root, "drizzle", name),
      "utf8",
    )
      .split("--> statement-breakpoint")
      .filter((sql) => sql.trim()))
      await db.prepare(statement).run();
  }
  async function call(url, body, cookie, extra = {}) {
    return mf.dispatchFetch(`https://veridoc.test${url}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://veridoc.test",
        "cf-connecting-ip": "192.0.2.10",
        ...(cookie ? { cookie } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  const anonymous = await call("/api/session", undefined, undefined, {
    "oai-authenticated-user-id": "owner",
    "oai-authenticated-user-email": "owner@example.test",
  });
  const anonData = await anonymous.json();
  assert.equal(anonData.authMode, "standalone");
  assert.equal(
    anonData.user,
    null,
    "Standalone deployment must ignore forged preview identity headers.",
  );
  const signup = await call("/api/auth/sign-up/email", {
    email: "worker-test@example.test",
    password: "Isolated-worker-test-123",
    name: "Runtime check",
  });
  assert.equal(signup.status, 200, await signup.clone().text());
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  const session = await (await call("/api/session", undefined, cookie)).json();
  assert.equal(session.user.emailVerified, false);
  assert.equal(session.isAdmin, false);
  assert.deepEqual(
    session.roles.map((role) => role.role),
    ["holder"],
  );
  assert.equal(
    (await call("/api/workspaces/reviewer", undefined, cookie)).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/api/holder/profile",
        {
          name: "Runtime check",
          profession: "Engineer",
          location: "Lagos",
          bio: "Test",
        },
        cookie,
      )
    ).status,
    200,
  );
  const saved = await (
    await call("/api/workspaces/holder", undefined, cookie)
  ).json();
  assert.equal(saved.profile.profession, "Engineer");
  assert.equal((await call("/api/auth/sign-out", {}, cookie)).status, 200);
  assert.equal(
    (await (await call("/api/session", undefined, cookie)).json()).user,
    null,
  );
  console.log(
    "Cloudflare runtime passed: registration, signed session, role enforcement, D1 persistence, sign-out and forged-header rejection.",
  );
} finally {
  await mf.dispose();
}
