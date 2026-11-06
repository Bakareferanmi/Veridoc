import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { createAuth, sessionIdentity } from "./auth.mjs";

function setup() {
  const db = new DatabaseSync(":memory:");
  for (const name of readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    db.exec(
      readFileSync(new URL(`../drizzle/${name}`, import.meta.url), "utf8"),
    );
  const env = {
    DB: db,
    BETTER_AUTH_SECRET: "isolated-test-secret-with-more-than-32-characters",
    APP_ORIGIN: "https://veridoc.test",
  };
  const auth = createAuth(env, new Request(env.APP_ORIGIN));
  const call = (path, body, headers = {}) =>
    auth.handler(
      new Request(`${env.APP_ORIGIN}/api/auth/${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          origin: env.APP_ORIGIN,
          "content-type": "application/json",
          "cf-connecting-ip": "192.0.2.1",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  return { db, auth, call };
}
test("standalone auth persists a hashed password, verifies cookies and revokes sign-out", async () => {
  const s = setup();
  const credentials = {
    email: "holder@example.test",
    password: "A-long-test-password-123",
    name: "Holder",
  };
  const signup = await s.call("sign-up/email", credentials);
  assert.equal(signup.status, 200, await signup.clone().text());
  const cookie = signup.headers.get("set-cookie").split(";")[0];
  assert.match(signup.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(signup.headers.get("set-cookie"), /Secure/i);
  const stored = s.db.prepare("SELECT password FROM auth_account").get();
  assert.ok(stored.password && !stored.password.includes(credentials.password));
  const session = await s.auth.api.getSession({
    headers: new Headers({ cookie }),
  });
  assert.equal(sessionIdentity(session).emailVerified, false);
  assert.equal(session.user.email, credentials.email);
  const bad = await s.call("sign-in/email", {
    email: credentials.email,
    password: "Wrong-password-123",
  });
  assert.equal(bad.status, 401);
  const good = await s.call("sign-in/email", credentials);
  assert.equal(good.status, 200);
  const signedOut = await s.call("sign-out", {}, { cookie });
  assert.equal(signedOut.status, 200);
  assert.equal(
    await s.auth.api.getSession({ headers: new Headers({ cookie }) }),
    null,
  );
  assert.equal(sessionIdentity(null), null);
});
test("standalone sign-in rejects cross-origin writes and forged identity headers", async () => {
  const s = setup();
  assert.equal(
    (
      await s.call(
        "sign-up/email",
        {
          email: "test@example.test",
          name: "Test",
          password: "A-long-test-password-123",
        },
        { origin: "https://other.test" },
      )
    ).status,
    403,
  );
  assert.equal(
    await s.auth.api.getSession({
      headers: new Headers({
        "oai-authenticated-user-id": "owner",
        "oai-authenticated-user-email": "owner@example.test",
      }),
    }),
    null,
  );
});
test("standalone sign-up enforces password length and shared rate limiting", async () => {
  const s = setup();
  const body = { email: "test@example.test", name: "Test", password: "short" };
  assert.equal((await s.call("sign-up/email", body)).status, 400);
  let response;
  for (let i = 0; i < 4; i++) response = await s.call("sign-up/email", body);
  assert.equal(response.status, 429);
  assert.ok(
    s.db.prepare("SELECT count(*) AS count FROM auth_rate_limit").get().count >
      0,
  );
});
