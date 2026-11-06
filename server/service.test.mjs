import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { handleApi } from "./service.mjs";
import { evaluateAssessment, EXAMPLE_SEAL } from "../src/lib/frameworks.js";
function setup() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url))
    .filter((name) => name.endsWith(".sql"))
    .sort())
    sqlite.exec(
      readFileSync(new URL(`../drizzle/${file}`, import.meta.url), "utf8"),
    );
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...args) {
          values = args;
          return this;
        },
        async first() {
          return statement.get(...values) || null;
        },
        async all() {
          return { results: statement.all(...values) };
        },
        async run() {
          const result = statement.run(...values);
          return { meta: { changes: result.changes } };
        },
      };
    },
    async batch(statements) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  };
  const owner = {
      userId: "owner",
      email: "owner@example.test",
      displayName: "Owner",
    },
    alice = {
      userId: "alice",
      email: "alice@example.test",
      displayName: "Alice",
    },
    bob = { userId: "bob", email: "bob@example.test", displayName: "Bob" };
  async function call(path, { user = alice, body, headers = {} } = {}) {
    const request = new Request(`https://veridoc.test${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(body === undefined
          ? {}
          : {
              "content-type": "application/json",
              origin: "https://veridoc.test",
            }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const response = await handleApi(request, {
      db,
      user,
      ownerEmail: owner.email,
    });
    return { status: response.status, body: await response.json() };
  }
  function grant(user, role, scope) {
    sqlite
      .prepare("INSERT INTO role_grants VALUES (?,?,?,?,?)")
      .run(
        `${user.userId}:${role}`,
        user.userId,
        role,
        scope,
        new Date().toISOString(),
      );
  }
  return { sqlite, db, call, owner, alice, bob, grant };
}
test("authentication and server grants cannot be replaced by a selected role or forged browser headers", async () => {
  const s = setup();
  assert.equal(
    (
      await s.call("/api/workspaces/reviewer", {
        user: null,
        headers: { "oai-authenticated-user-id": "owner" },
      })
    ).status,
    401,
  );
  assert.deepEqual(
    (await s.call("/api/session")).body.roles.map((r) => r.role),
    ["holder"],
  );
  assert.equal(
    (
      await s.call("/api/institution/profile", {
        body: { role: "institution", name: "Fake", scope: "All" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await s.call("/api/access/request", {
        body: { role: "reviewer", note: "Please review my access" },
      })
    ).status,
    201,
  );
  assert.equal((await s.call("/api/workspaces/reviewer")).status, 403);
  assert.equal((await s.call("/api/admin/access")).status, 403);
});
test("profile data persists and client-supplied verification status is discarded", async () => {
  const s = setup();
  await s.call("/api/holder/profile", {
    body: {
      name: "Alice Example",
      profession: "Engineer",
      location: "Lagos",
      bio: "Projects",
    },
  });
  const qualification = await s.call("/api/holder/qualifications", {
    body: {
      title: "Safety course",
      issuer: "Issuer",
      status: "Verified",
      grade: 3,
    },
  });
  assert.equal(qualification.body.data.status, "Self-declared");
  const workspace = (await s.call("/api/workspaces/holder")).body;
  assert.equal(workspace.profile.name, "Alice Example");
  assert.equal(workspace.qualifications.length, 1);
  assert.equal(
    (await s.call("/api/workspaces/holder", { user: s.bob })).body
      .qualifications.length,
    0,
  );
});
test("shared proof discloses only selected fields and revocation survives a later read", async () => {
  const s = setup();
  const qualification = (
    await s.call("/api/holder/qualifications", {
      body: {
        title: "Course",
        issuer: "Issuer",
        reference: "SECRET-REFERENCE",
      },
    })
  ).body;
  const payload = {
    qualificationId: qualification.id,
    fields: ["title", "issuer"],
    purpose: "Employment check",
    hours: 24,
    consent: true,
  };
  assert.equal(
    (
      await s.call("/api/holder/shares", {
        body: { ...payload, consent: false },
      })
    ).status,
    422,
  );
  const share = (await s.call("/api/holder/shares", { body: payload })).body;
  const publicView = await s.call(`/api/public/shares/${share.id}`, {
    user: null,
  });
  assert.equal(publicView.status, 200);
  assert.deepEqual(
    publicView.body.rows.map((row) => row[0]),
    ["Status", "Credential", "Issuer"],
  );
  assert.equal(
    JSON.stringify(publicView.body).includes("SECRET-REFERENCE"),
    false,
  );
  assert.equal(
    (
      await s.call("/api/holder/revoke", {
        user: s.bob,
        body: { id: share.id },
      })
    ).status,
    404,
  );
  assert.equal(
    (await s.call("/api/holder/revoke", { body: { id: share.id } })).status,
    200,
  );
  assert.equal(
    (await s.call(`/api/public/shares/${share.id}`, { user: null })).status,
    404,
  );
});
test("institutions are scoped and a submitted credential never becomes verified by registration", async () => {
  const s = setup();
  await s.call("/api/session");
  await s.call("/api/session", { user: s.bob });
  s.grant(s.alice, "institution", "org-a");
  s.grant(s.bob, "institution", "org-b");
  const issued = await s.call("/api/institution/credentials", {
    body: {
      reference: "VDC-001",
      holder: "Learner",
      title: "Course",
      status: "Verified",
    },
  });
  assert.equal(issued.body.data.status, "Issuer-submitted");
  assert.equal(
    (await s.call("/api/workspaces/institution")).body.credentials.length,
    1,
  );
  assert.equal(
    (await s.call("/api/workspaces/institution", { user: s.bob })).body
      .credentials.length,
    0,
  );
});
test("evidence is required, subscription inputs cannot change grades, and Grade 3 remains in second review", async () => {
  const s = setup();
  await s.call("/api/reviewer/example", { user: s.owner, body: {} });
  const row = (await s.call("/api/workspaces/reviewer", { user: s.owner })).body
    .cases[0];
  const decision = {
    id: row.id,
    scores: [22, 20, 16, 11, 6, 4],
    gates: [true, true, true, true, true],
    verifiedEvidence: [],
  };
  const original = s.sqlite
    .prepare("SELECT * FROM workspace_records WHERE id=?")
    .get(row.id);
  for (const id of ["paid-case", "high-case"])
    s.sqlite
      .prepare("INSERT INTO workspace_records VALUES (?,?,?,?,?,?,?)")
      .run(
        id,
        original.kind,
        original.scope,
        original.owner_id,
        original.data,
        original.created_at,
        original.updated_at,
      );
  assert.equal(
    (await s.call("/api/reviewer/decision", { user: s.owner, body: decision }))
      .status,
    422,
  );
  const free = await s.call("/api/reviewer/decision", {
    user: s.owner,
    body: {
      ...decision,
      verifiedEvidence: [0, 1, 2, 3, 4, 5],
      subscription: "Free",
      grade: 3,
    },
  });
  const paid = await s.call("/api/reviewer/decision", {
    user: s.owner,
    body: {
      ...decision,
      id: "paid-case",
      verifiedEvidence: [0, 1, 2, 3, 4, 5],
      subscription: "Visibility",
      amountPaid: 1000000,
    },
  });
  assert.equal(free.body.assessment.grade, 2);
  assert.equal(paid.body.assessment.grade, free.body.assessment.grade);
  const high = await s.call("/api/reviewer/decision", {
    user: s.owner,
    body: {
      ...decision,
      id: "high-case",
      scores: [25, 25, 15, 10, 6, 4],
      verifiedEvidence: [0, 1, 2, 3, 4, 5],
    },
  });
  assert.equal(high.body.assessment.grade, 3);
  assert.equal(high.body.status, "Second review required");
  assert.equal(
    s.sqlite
      .prepare("SELECT count(*) n FROM workspace_records WHERE kind='seal'")
      .get().n,
    0,
  );
});
test("self-review and cross-jurisdiction regulator decisions are blocked", async () => {
  const s = setup();
  await s.call("/api/session");
  s.grant(s.alice, "institution", "org-a");
  s.grant(s.alice, "reviewer", "*");
  await s.call("/api/institution/profile", {
    body: {
      name: "Own Institute",
      kind: "institution",
      scope: "Short courses",
      jurisdiction: "Ghana",
    },
  });
  const submitted = await s.call("/api/institution/request-review", {
    body: {
      evidence: [{ category: 0, title: "Registration", reference: "SOURCE-1" }],
    },
  });
  assert.equal(submitted.status, 201);
  assert.equal(
    (await s.call("/api/reviewer/claim", { body: { id: submitted.body.id } }))
      .status,
    403,
  );
  await s.call("/api/session", { user: s.bob });
  s.grant(s.bob, "regulator", "Nigeria");
  assert.equal(
    (await s.call("/api/workspaces/regulator", { user: s.bob })).body.records
      .length,
    0,
  );
  assert.equal(
    (
      await s.call("/api/regulator/confirm", {
        user: s.bob,
        body: {
          id: submitted.body.id,
          body: "Authority",
          reference: "Reference",
          authority: "Confirmed",
          accreditation: "Confirmed",
        },
      })
    ).status,
    404,
  );
});
test("appeals are durable and cannot expose another holder’s private case", async () => {
  const s = setup();
  const target = await s.call("/api/holder/request-review", {
    body: {
      evidence: [
        { category: 0, title: "Identity check", reference: "Secure source" },
      ],
    },
  });
  assert.equal(
    (
      await s.call("/api/appeals", {
        user: s.bob,
        body: {
          reference: target.body.id,
          description: "Trying another user record",
        },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await s.call("/api/appeals", {
        body: {
          reference: EXAMPLE_SEAL.verificationReference,
          type: "Correction",
          description: "New source evidence",
        },
      })
    ).status,
    201,
  );
  assert.equal(
    (await s.call("/api/appeals")).body.appeals[0].data.status,
    "Received",
  );
});
test("cross-site writes and non-JSON form posts are rejected", async () => {
  const s = setup();
  assert.equal(
    (
      await s.call("/api/holder/profile", {
        body: { name: "Changed" },
        headers: { origin: "https://untrusted.test" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await s.call("/api/holder/profile", {
        body: { name: "Changed" },
        headers: { "content-type": "text/plain" },
      })
    ).status,
    415,
  );
});
test("all subject types use bounded evidence-based scores", () => {
  for (const kind of ["institution", "individual", "business"]) {
    const evidence = Array.from({ length: 6 }, (_, category) => ({
      category,
      verified: true,
      reference: `source-${category}`,
    }));
    assert.equal(
      evaluateAssessment(
        kind,
        [22, 20, 16, 11, 6, 4],
        [true, true, true, true, true],
        evidence,
      ).grade,
      2,
    );
    assert.throws(() =>
      evaluateAssessment(
        kind,
        [26, 20, 16, 11, 6, 4],
        [true, true, true, true, true],
        evidence,
      ),
    );
  }
});

test("Grade 3 requires a different assigned reviewer and a recorded decision cannot be overwritten", async () => {
  const s = setup();
  await s.call("/api/reviewer/example", { user: s.owner, body: {} });
  const row = (await s.call("/api/workspaces/reviewer", { user: s.owner })).body
    .cases[0];
  const decision = {
    id: row.id,
    scores: [25, 25, 15, 10, 6, 4],
    gates: [true, true, true, true, true],
    verifiedEvidence: [0, 1, 2, 3, 4, 5],
  };
  assert.equal(
    (await s.call("/api/reviewer/decision", { user: s.owner, body: decision }))
      .body.status,
    "Second review required",
  );
  assert.equal(
    (
      await s.call("/api/reviewer/claim-second", {
        user: s.owner,
        body: { id: row.id },
      })
    ).status,
    403,
  );
  await s.call("/api/session", { user: s.bob });
  s.grant(s.bob, "reviewer", "*");
  assert.equal(
    (
      await s.call("/api/reviewer/second-decision", {
        user: s.bob,
        body: decision,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await s.call("/api/reviewer/claim-second", {
        user: s.bob,
        body: { id: row.id },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await s.call("/api/reviewer/second-decision", {
        user: s.bob,
        body: decision,
      })
    ).body.status,
    "Decision recorded",
  );
  assert.equal(
    (await s.call("/api/reviewer/decision", { user: s.owner, body: decision }))
      .status,
    409,
  );
});
