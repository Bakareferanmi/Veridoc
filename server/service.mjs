import {
  ApiError,
  requireIdentity,
  requireRole,
  requireOwner,
  checkOrigin,
  canReview,
  safeText,
  ROLES,
} from "./policy.mjs";
import {
  FRAMEWORKS,
  FRAMEWORK_VERSION,
  EXAMPLE_SEAL,
  OPPORTUNITIES,
  evaluateAssessment,
} from "../src/lib/frameworks.js";
const stamp = () => new Date().toISOString();
const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
function unpack(row) {
  return row ? { ...row, data: JSON.parse(row.data) } : null;
}
export async function handleApi(request, { db, user, ownerEmail = "" }) {
  try {
    checkOrigin(request);
    const path = new URL(request.url).pathname.replace(/\/$/, "");
    const method = request.method;
    if (path === "/api/public/frameworks" && method === "GET")
      return json({ version: FRAMEWORK_VERSION, frameworks: FRAMEWORKS });
    if (path === `/api/public/seals/${EXAMPLE_SEAL.id}` && method === "GET")
      return json(EXAMPLE_SEAL);
    if (path.startsWith("/api/public/shares/") && method === "GET") {
      if (!db) throw new ApiError(503, "Storage unavailable.");
      const row = unpack(
        await db
          .prepare("SELECT * FROM workspace_records WHERE id = ? AND kind = ?")
          .bind(path.split("/").pop(), "share")
          .first(),
      );
      if (
        !row ||
        row.data.revoked ||
        new Date(row.data.expiresAt) <= new Date()
      )
        throw new ApiError(404, "Link expired or revoked.");
      return json({
        rows: row.data.rows,
        expiresAt: row.data.expiresAt,
        purpose: row.data.purpose,
      });
    }
    if (path.startsWith("/api/public/seals/") && method === "GET") {
      if (!db) throw new ApiError(503, "Storage unavailable.");
      const row = unpack(
        await db
          .prepare("SELECT * FROM workspace_records WHERE id = ? AND kind = ?")
          .bind(path.split("/").pop(), "seal")
          .first(),
      );
      if (!row) throw new ApiError(404, "Verification record not found.");
      return json(row.data);
    }
    if (path === "/api/session" && !user)
      return json({ user: null, roles: [], isAdmin: false });
    requireIdentity(user);
    if (!db) throw new ApiError(503, "Account storage unavailable.");
    const time = stamp();
    await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO accounts (id,email,name,created_at) VALUES (?,?,?,?)",
        )
        .bind(user.userId, user.email, user.displayName || user.email, time),
      db
        .prepare(
          "INSERT OR IGNORE INTO profiles (user_id,name,profession,location,bio,updated_at) VALUES (?,?,?,?,?,?)",
        )
        .bind(user.userId, user.displayName || user.email, "", "", "", time),
      db
        .prepare(
          "INSERT OR IGNORE INTO role_grants (id,user_id,role,scope,created_at) VALUES (?,?,?,?,?)",
        )
        .bind(
          `${user.userId}:holder`,
          user.userId,
          "holder",
          user.userId,
          time,
        ),
    ]);
    const isAdmin = Boolean(
      ownerEmail && user.email.toLowerCase() === ownerEmail.toLowerCase(),
    );
    if (isAdmin)
      await db.batch(
        ["institution", "reviewer", "regulator"].map((role) =>
          db
            .prepare(
              "INSERT OR IGNORE INTO role_grants (id,user_id,role,scope,created_at) VALUES (?,?,?,?,?)",
            )
            .bind(
              `${user.userId}:${role}`,
              user.userId,
              role,
              role === "institution" ? `org-${user.userId}` : "*",
              time,
            ),
        ),
      );
    const grants = (
      await db
        .prepare("SELECT role,scope FROM role_grants WHERE user_id = ?")
        .bind(user.userId)
        .all()
    ).results;
    const get = async (id) =>
      unpack(
        await db
          .prepare("SELECT * FROM workspace_records WHERE id = ?")
          .bind(id)
          .first(),
      );
    const list = async (kind, { scope, owner } = {}) => {
      let sql = "SELECT * FROM workspace_records WHERE kind = ?";
      const binds = [kind];
      if (scope !== undefined) {
        sql += " AND scope = ?";
        binds.push(scope);
      }
      if (owner !== undefined) {
        sql += " AND owner_id = ?";
        binds.push(owner);
      }
      return (
        await db
          .prepare(sql + " ORDER BY updated_at DESC LIMIT 200")
          .bind(...binds)
          .all()
      ).results.map(unpack);
    };
    const put = async ({
      id = crypto.randomUUID(),
      kind,
      scope = user.userId,
      owner = user.userId,
      data,
    }) => {
      await db
        .prepare(
          "INSERT INTO workspace_records (id,kind,scope,owner_id,data,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,owner_id=excluded.owner_id,updated_at=excluded.updated_at",
        )
        .bind(id, kind, scope, owner, JSON.stringify(data), time, time)
        .run();
      return {
        id,
        kind,
        scope,
        owner_id: owner,
        data,
        created_at: time,
        updated_at: time,
      };
    };
    const audit = async (action, target = "", scope = user.userId) =>
      db
        .prepare(
          "INSERT INTO audit_events (id,user_id,action,target_id,scope,created_at) VALUES (?,?,?,?,?,?)",
        )
        .bind(crypto.randomUUID(), user.userId, action, target, scope, time)
        .run();
    const body = async () => {
      const text = await request.text();
      if (text.length > 65000) throw new ApiError(413, "Request too large.");
      try {
        return JSON.parse(text);
      } catch {
        throw new ApiError(400, "Invalid JSON.");
      }
    };
    const institution = () => requireRole(grants, "institution");
    const onboarding = async (role) =>
      (await get(`onboarding:${user.userId}:${role}`))?.data || {};
    if (path === "/api/onboarding" && method === "POST") {
      const b = await body();
      if (!["reviewer", "regulator"].includes(b.role))
        throw new ApiError(422, "Choose a review workspace.");
      const grant = requireRole(grants, b.role);
      if (
        b.step !== "policy" &&
        !(b.step === "scope" && b.role === "regulator")
      )
        throw new ApiError(422, "Choose a setup step.");
      const previous = await onboarding(b.role);
      await put({
        id: `onboarding:${user.userId}:${b.role}`,
        kind: "onboarding",
        data: {
          ...previous,
          ...(b.step === "policy"
            ? { policyVersion: FRAMEWORK_VERSION, policyReviewedAt: time }
            : { confirmedScope: grant.scope, scopeReviewedAt: time }),
        },
      });
      await audit("Setup acknowledged", b.role);
      return json({ ok: true });
    }
    if (path === "/api/session" && method === "GET")
      return json({
        user: {
          id: user.userId,
          email: user.email,
          name: user.displayName || user.email,
        },
        roles: grants,
        isAdmin,
        requests: await list("role_request", { owner: user.userId }),
      });
    if (path === "/api/access/request" && method === "POST") {
      const b = await body();
      if (!ROLES.includes(b.role) || b.role === "holder")
        throw new ApiError(422, "Choose a workspace role.");
      if (grants.some((g) => g.role === b.role))
        throw new ApiError(409, "Role already assigned.");
      const id = `role-request:${user.userId}:${b.role}`;
      const previous = await get(id);
      if (previous?.data.status === "Pending")
        throw new ApiError(409, "Request already pending.");
      await put({
        id,
        kind: "role_request",
        data: {
          role: b.role,
          note: safeText(b.note, 1000),
          email: user.email,
          status: "Pending",
        },
      });
      await audit("Role requested", b.role);
      return json({ ok: true }, 201);
    }
    if (path === "/api/admin/access" && method === "GET") {
      if (!isAdmin) throw new ApiError(403, "Administrator access required.");
      return json({ requests: await list("role_request") });
    }
    if (path === "/api/admin/access" && method === "POST") {
      if (!isAdmin) throw new ApiError(403, "Administrator access required.");
      const b = await body(),
        row = await get(b.id);
      if (!row || row.kind !== "role_request")
        throw new ApiError(404, "Request not found.");
      if (!["Approved", "Declined"].includes(b.status))
        throw new ApiError(422, "Choose approve or decline.");
      if (b.status === "Approved") {
        const scope =
          row.data.role === "institution"
            ? `org-${row.owner_id}`
            : row.data.role === "regulator"
              ? safeText(b.scope, 100)
              : "*";
        if (!scope) throw new ApiError(422, "Add the regulator jurisdiction.");
        await db
          .prepare(
            "INSERT OR IGNORE INTO role_grants (id,user_id,role,scope,created_at) VALUES (?,?,?,?,?)",
          )
          .bind(
            `${row.owner_id}:${row.data.role}`,
            row.owner_id,
            row.data.role,
            scope,
            time,
          )
          .run();
      }
      await put({
        ...row,
        owner: row.owner_id,
        data: {
          ...row.data,
          status: b.status,
          reviewedBy: user.userId,
          reviewedAt: time,
          reviewNote: safeText(b.reviewNote, 600),
        },
      });
      await audit(`Role ${b.status.toLowerCase()}`, row.id);
      return json({ ok: true });
    }
    if (path === "/api/workspaces/holder" && method === "GET") {
      requireRole(grants, "holder");
      return json({
        profile: await db
          .prepare("SELECT * FROM profiles WHERE user_id = ?")
          .bind(user.userId)
          .first(),
        qualifications: await list("qualification", { owner: user.userId }),
        shares: await list("share", { owner: user.userId }),
        appeals: await list("appeal", { owner: user.userId }),
        saved: await list("saved_opportunity", { owner: user.userId }),
        opportunities: OPPORTUNITIES,
        assessments: await list("case", { scope: user.userId }),
        seals: await list("seal", { scope: user.userId }),
      });
    }
    if (path === "/api/holder/profile" && method === "POST") {
      requireRole(grants, "holder");
      const b = await body();
      if (!safeText(b.name)) throw new ApiError(422, "Add your name.");
      await db
        .prepare(
          "UPDATE profiles SET name=?,profession=?,location=?,bio=?,updated_at=? WHERE user_id=?",
        )
        .bind(
          safeText(b.name),
          safeText(b.profession),
          safeText(b.location),
          safeText(b.bio, 1200),
          time,
          user.userId,
        )
        .run();
      await audit("Profile updated");
      return json({ ok: true });
    }
    if (path === "/api/holder/qualifications" && method === "POST") {
      requireRole(grants, "holder");
      const b = await body();
      if (!safeText(b.title) || !safeText(b.issuer))
        throw new ApiError(422, "Add the qualification and issuer.");
      const row = await put({
        kind: "qualification",
        data: {
          title: safeText(b.title),
          issuer: safeText(b.issuer),
          issued: safeText(b.issued, 20),
          expires: safeText(b.expires, 20),
          reference: safeText(b.reference),
          status: "Self-declared",
        },
      });
      await audit("Qualification added", row.id);
      return json(row, 201);
    }
    if (path === "/api/holder/request-review" && method === "POST") {
      requireRole(grants, "holder");
      const b = await body();
      const profile = await db
        .prepare("SELECT * FROM profiles WHERE user_id=?")
        .bind(user.userId)
        .first();
      if (
        !Array.isArray(b.evidence) ||
        !b.evidence.length ||
        b.evidence.length > 20
      )
        throw new ApiError(422, "Add source evidence.");
      const evidence = b.evidence.map((e) => ({
        category: Number(e.category),
        title: safeText(e.title),
        reference: safeText(e.reference, 500),
        verified: false,
      }));
      if (
        evidence.some(
          (e) =>
            !Number.isInteger(e.category) ||
            e.category < 0 ||
            e.category > 5 ||
            !e.title ||
            !e.reference,
        )
      )
        throw new ApiError(422, "Complete each evidence reference.");
      const row = await put({
        kind: "case",
        scope: user.userId,
        owner: "",
        data: {
          subject: profile.name,
          kind: "individual",
          scope: "Identity, qualifications and professional claims",
          jurisdiction: profile.location || "Not specified",
          submittedBy: user.userId,
          status: "Awaiting assignment",
          evidence,
          scores: [0, 0, 0, 0, 0, 0],
          gates: [false, false, false, false, false],
          frameworkVersion: FRAMEWORK_VERSION,
          example: false,
        },
      });
      await audit("Individual assessment requested", row.id);
      return json(row, 201);
    }
    if (path === "/api/holder/opportunities" && method === "POST") {
      requireRole(grants, "holder");
      const b = await body();
      if (!OPPORTUNITIES.some((item) => item.id === b.id))
        throw new ApiError(404, "Opportunity not found.");
      const id = `saved:${user.userId}:${b.id}`;
      if (b.saved === false)
        await db
          .prepare(
            "DELETE FROM workspace_records WHERE id=? AND owner_id=? AND kind=?",
          )
          .bind(id, user.userId, "saved_opportunity")
          .run();
      else
        await put({
          id,
          kind: "saved_opportunity",
          data: { opportunityId: b.id },
        });
      return json({ ok: true });
    }
    if (path === "/api/holder/shares" && method === "POST") {
      requireRole(grants, "holder");
      const b = await body();
      if (b.consent !== true)
        throw new ApiError(422, "Confirm consent to share.");
      const qualification = requireOwner(await get(b.qualificationId), user);
      if (qualification.kind !== "qualification")
        throw new ApiError(404, "Qualification not found.");
      const allowed = [
        "title",
        "issuer",
        "issued",
        "expires",
        "reference",
        "name",
      ];
      if (
        !Array.isArray(b.fields) ||
        b.fields.some((key) => !allowed.includes(key))
      )
        throw new ApiError(422, "Invalid shared fields.");
      const hours = [24, 168, 720].includes(Number(b.hours))
        ? Number(b.hours)
        : 24;
      const profile = await db
        .prepare("SELECT name FROM profiles WHERE user_id=?")
        .bind(user.userId)
        .first();
      const labels = {
        title: "Credential",
        issuer: "Issuer",
        issued: "Issued",
        expires: "Expires",
        reference: "Reference",
        name: "Holder",
      };
      const rows = [
        ["Status", qualification.data.status],
        ...b.fields.map((key) => [
          labels[key],
          key === "name"
            ? profile.name
            : qualification.data[key] || "Not provided",
        ]),
      ];
      const row = await put({
        kind: "share",
        data: {
          rows,
          purpose: safeText(b.purpose),
          recipient: safeText(b.recipient),
          expiresAt: new Date(Date.now() + hours * 36e5).toISOString(),
          revoked: false,
          consentAt: time,
        },
      });
      await audit("Share link created", row.id);
      return json(row, 201);
    }
    if (path === "/api/holder/revoke" && method === "POST") {
      const b = await body(),
        row = requireOwner(await get(b.id), user);
      if (row.kind !== "share") throw new ApiError(404, "Link not found.");
      await put({
        ...row,
        owner: row.owner_id,
        data: { ...row.data, revoked: true },
      });
      await audit("Share revoked", row.id);
      return json({ ok: true });
    }
    if (path === "/api/workspaces/institution" && method === "GET") {
      const grant = institution();
      return json({
        scope: grant.scope,
        profile: (await get(`institution:${grant.scope}`))?.data || {
          name: "Your institution",
          kind: "institution",
          jurisdiction: "Nigeria",
          scope: "",
          registration: "",
        },
        credentials: await list("issued_credential", { scope: grant.scope }),
        cases: await list("case", { scope: grant.scope }),
        confirmations: await list("confirmation", { scope: grant.scope }),
        plan: (await get(`plan:${grant.scope}`))?.data || {
          current: "Free",
          requested: null,
        },
        seals: await list("seal", { scope: grant.scope }),
      });
    }
    if (path === "/api/institution/profile" && method === "POST") {
      const grant = institution(),
        b = await body();
      if (
        !safeText(b.name) ||
        !safeText(b.scope) ||
        !["institution", "business"].includes(b.kind)
      )
        throw new ApiError(422, "Add the name, type and verification scope.");
      await put({
        id: `institution:${grant.scope}`,
        kind: "institution",
        scope: grant.scope,
        data: {
          name: safeText(b.name),
          kind: b.kind,
          scope: safeText(b.scope, 600),
          jurisdiction: safeText(b.jurisdiction) || "Nigeria",
          registration: safeText(b.registration),
        },
      });
      await audit("Institution profile updated", grant.scope, grant.scope);
      return json({ ok: true });
    }
    if (path === "/api/institution/credentials" && method === "POST") {
      const grant = institution(),
        b = await body();
      if (!safeText(b.reference) || !safeText(b.holder) || !safeText(b.title))
        throw new ApiError(422, "Add the reference, holder and credential.");
      const duplicate = (
        await list("issued_credential", { scope: grant.scope })
      ).some(
        (row) =>
          row.data.reference.toLowerCase() === b.reference.trim().toLowerCase(),
      );
      if (duplicate) throw new ApiError(409, "Reference already exists.");
      const row = await put({
        kind: "issued_credential",
        scope: grant.scope,
        data: {
          reference: safeText(b.reference),
          holder: safeText(b.holder),
          title: safeText(b.title),
          issued: safeText(b.issued, 20) || time.slice(0, 10),
          status: "Issuer-submitted",
        },
      });
      await audit("Credential registered", row.id, grant.scope);
      return json(row, 201);
    }
    if (path === "/api/institution/request-review" && method === "POST") {
      const grant = institution(),
        b = await body(),
        profile = (await get(`institution:${grant.scope}`))?.data;
      if (!profile?.scope)
        throw new ApiError(422, "Complete the institution profile first.");
      if (
        !Array.isArray(b.evidence) ||
        !b.evidence.length ||
        b.evidence.length > 20
      )
        throw new ApiError(422, "Add at least one evidence reference.");
      const evidence = b.evidence.map((e) => ({
        category: Number(e.category),
        title: safeText(e.title),
        reference: safeText(e.reference, 500),
        verified: false,
      }));
      if (
        evidence.some(
          (e) =>
            !Number.isInteger(e.category) ||
            e.category < 0 ||
            e.category > 5 ||
            !e.title ||
            !e.reference,
        )
      )
        throw new ApiError(422, "Complete each evidence reference.");
      const row = await put({
        kind: "case",
        scope: grant.scope,
        owner: "",
        data: {
          subject: profile.name,
          kind: profile.kind,
          scope: profile.scope,
          jurisdiction: profile.jurisdiction,
          submittedBy: user.userId,
          status: "Awaiting assignment",
          evidence,
          scores: [0, 0, 0, 0, 0, 0],
          gates: [false, false, false, false, false],
          frameworkVersion: FRAMEWORK_VERSION,
          example: false,
        },
      });
      await audit("Verification requested", row.id, grant.scope);
      return json(row, 201);
    }
    if (path === "/api/institution/plan" && method === "POST") {
      const grant = institution(),
        b = await body();
      if (!["Free", "Visibility"].includes(b.plan))
        throw new ApiError(422, "Choose a plan.");
      await put({
        id: `plan:${grant.scope}`,
        kind: "plan",
        scope: grant.scope,
        data: {
          current: "Free",
          requested: b.plan === "Free" ? null : "Visibility",
          billing: "Not connected",
        },
      });
      await audit("Plan interest updated", grant.scope, grant.scope);
      return json({ ok: true, message: "Request recorded. No payment taken." });
    }
    if (path === "/api/workspaces/reviewer" && method === "GET") {
      requireRole(grants, "reviewer");
      const cases = (await list("case")).filter((row) =>
        canReview(row, user, grants),
      );
      return json({
        onboarding: await onboarding("reviewer"),
        cases: cases.filter(
          (row) =>
            row.owner_id === user.userId ||
            row.data.secondReviewerId === user.userId,
        ),
        secondQueue: cases
          .filter(
            (row) =>
              row.data.status === "Second review required" &&
              row.data.reviewerId !== user.userId &&
              !row.data.secondReviewerId,
          )
          .map(({ id, data }) => ({
            id,
            subject: data.subject,
            kind: data.kind,
            status: data.status,
          })),
        queue: cases
          .filter((row) => !row.owner_id)
          .map(({ id, data }) => ({
            id,
            subject: data.subject,
            kind: data.kind,
            status: data.status,
          })),
        audit: (
          await db
            .prepare(
              "SELECT action,target_id,created_at FROM audit_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
            )
            .bind(user.userId)
            .all()
        ).results,
      });
    }
    if (path === "/api/reviewer/example" && method === "POST") {
      requireRole(grants, "reviewer");
      if (!isAdmin)
        throw new ApiError(403, "Administrator access required for examples.");
      const id = `example-case:${user.userId}`;
      if (await get(id)) return json({ ok: true });
      const titles = [
        "Registration record",
        "Issuing scope",
        "Credential register",
        "Governance policy",
        "Security controls",
        "Renewal policy",
      ];
      await put({
        id,
        kind: "case",
        scope: "example-institution",
        owner: user.userId,
        data: {
          subject: "ABC Technical Learning Centre",
          kind: "institution",
          scope: EXAMPLE_SEAL.scope,
          jurisdiction: "Nigeria",
          submittedBy: "example-submitter",
          status: "Assigned",
          example: true,
          evidence: titles.map((title, category) => ({
            category,
            title,
            reference: `EXAMPLE-EV-${category + 1}`,
            verified: false,
          })),
          scores: [22, 20, 16, 11, 6, 4],
          gates: [true, true, true, true, true],
          frameworkVersion: FRAMEWORK_VERSION,
        },
      });
      await audit("Example case opened", id);
      return json({ ok: true });
    }
    if (path === "/api/reviewer/claim" && method === "POST") {
      requireRole(grants, "reviewer");
      const b = await body(),
        row = await get(b.id);
      if (
        !row ||
        row.kind !== "case" ||
        row.owner_id ||
        !canReview(row, user, grants)
      )
        throw new ApiError(403, "Case unavailable for assignment.");
      const result = await db
        .prepare(
          "UPDATE workspace_records SET owner_id=?,data=?,updated_at=? WHERE id=? AND owner_id=?",
        )
        .bind(
          user.userId,
          JSON.stringify({ ...row.data, status: "Assigned" }),
          time,
          row.id,
          "",
        )
        .run();
      if (!result.meta.changes)
        throw new ApiError(409, "Case already assigned.");
      await audit("Case assigned", row.id, row.scope);
      return json({ ok: true });
    }
    if (path === "/api/reviewer/claim-second" && method === "POST") {
      requireRole(grants, "reviewer");
      const b = await body(),
        row = await get(b.id);
      if (
        !row ||
        row.kind !== "case" ||
        row.data.status !== "Second review required" ||
        row.data.reviewerId === user.userId ||
        row.data.secondReviewerId ||
        !canReview(row, user, grants)
      )
        throw new ApiError(403, "Independent second reviewer required.");
      const result = await db
        .prepare(
          "UPDATE workspace_records SET data=?,updated_at=? WHERE id=? AND data=?",
        )
        .bind(
          JSON.stringify({ ...row.data, secondReviewerId: user.userId }),
          time,
          row.id,
          JSON.stringify(row.data),
        )
        .run();
      if (!result.meta.changes)
        throw new ApiError(409, "Case already assigned.");
      await audit("Second reviewer assigned", row.id, row.scope);
      return json({ ok: true });
    }
    if (
      ["/api/reviewer/decision", "/api/reviewer/second-decision"].includes(
        path,
      ) &&
      method === "POST"
    ) {
      requireRole(grants, "reviewer");
      const b = await body(),
        row = await get(b.id),
        second = path.endsWith("/second-decision");
      if (!row || row.kind !== "case" || !canReview(row, user, grants))
        throw new ApiError(403, "Independent review required.");
      if (second) {
        if (
          row.data.secondReviewerId !== user.userId ||
          row.data.reviewerId === user.userId ||
          row.data.status !== "Second review required"
        )
          throw new ApiError(
            403,
            "Assigned independent second reviewer required.",
          );
      } else {
        requireOwner(row, user);
        if (
          row.data.status === "Decision recorded" ||
          row.data.secondReviewerId
        )
          throw new ApiError(
            409,
            "Decision locked. Use an independent review or appeal.",
          );
      }
      const evidence = row.data.evidence.map((e, i) => ({
        ...e,
        verified:
          Array.isArray(b.verifiedEvidence) && b.verifiedEvidence.includes(i),
      }));
      let assessment;
      try {
        assessment = evaluateAssessment(
          row.data.kind,
          b.escalate === true && Array.isArray(b.scores)
            ? b.scores.map((score, i) =>
                evidence.some((e) => e.category === i && e.verified)
                  ? score
                  : 0,
              )
            : b.scores,
          b.gates,
          evidence,
        );
      } catch (error) {
        throw new ApiError(422, error.message);
      }
      const needsSecond =
        assessment.blocked ||
        (assessment.grade === 3 && !second) ||
        b.escalate === true;
      const status = needsSecond
        ? "Second review required"
        : "Decision recorded";
      const data = {
        ...row.data,
        evidence,
        scores: b.scores,
        gates: b.gates,
        assessment,
        status,
        reviewerId: second ? row.data.reviewerId : user.userId,
        ...(second
          ? { secondReviewerId: user.userId, secondDecisionAt: time }
          : {}),
        decisionAt: time,
      };
      const saved = await db
        .prepare(
          "UPDATE workspace_records SET data=?,updated_at=? WHERE id=? AND data=?",
        )
        .bind(JSON.stringify(data), time, row.id, JSON.stringify(row.data))
        .run();
      if (!saved.meta.changes)
        throw new ApiError(
          409,
          "Case changed. Reload before recording a decision.",
        );
      await audit(status, row.id, row.scope);
      if (!needsSecond && assessment.grade > 0 && !row.data.example) {
        const id = `VDC-VER-${row.id}`;
        await put({
          id,
          kind: "seal",
          scope: row.scope,
          data: {
            id,
            verificationReference: id,
            institution: data.subject,
            kind: data.kind,
            scope: data.scope,
            jurisdiction: data.jurisdiction,
            grade: assessment.grade,
            status: "Active",
            verifiedAt: time.slice(0, 10),
            reviewAt: new Date(Date.now() + 365 * 864e5)
              .toISOString()
              .slice(0, 10),
            identity: "Verified",
            authority:
              assessment.grade >= 2
                ? "Verified for the stated scope"
                : "Not confirmed",
            accreditation: "Not claimed",
            regulatoryRecognition: "Not independently confirmed",
            frameworkVersion: FRAMEWORK_VERSION,
            example: false,
            evidence: evidence
              .filter((e) => e.verified)
              .map((e) => ({
                name: e.title,
                source: e.reference,
                date: time.slice(0, 10),
              })),
          },
        });
      }
      if (
        !needsSecond &&
        assessment.grade >= 2 &&
        data.kind === "individual" &&
        !data.example
      ) {
        const references = new Set(
          evidence
            .filter((e) => e.verified && e.category === 1)
            .map((e) => e.reference),
        );
        for (const qualification of await list("qualification", {
          owner: data.submittedBy,
        })) {
          if (
            qualification.data.reference &&
            references.has(qualification.data.reference)
          )
            await put({
              ...qualification,
              owner: qualification.owner_id,
              data: {
                ...qualification.data,
                status: "Source-verified",
                verifiedAt: time,
                assessmentId: row.id,
              },
            });
        }
      }
      return json({ ok: true, assessment, status });
    }
    if (path === "/api/appeals" && method === "GET")
      return json({ appeals: await list("appeal", { owner: user.userId }) });
    if (path === "/api/appeals" && method === "POST") {
      const b = await body();
      if (!safeText(b.reference) || !safeText(b.description))
        throw new ApiError(422, "Add the assessment reference and evidence.");
      const reference = safeText(b.reference);
      if (
        reference !== EXAMPLE_SEAL.id &&
        reference !== EXAMPLE_SEAL.verificationReference
      ) {
        const row = await get(reference);
        if (
          !row ||
          (row.owner_id !== user.userId &&
            !grants.some(
              (g) => g.role === "institution" && g.scope === row.scope,
            ) &&
            row.kind !== "seal")
        )
          throw new ApiError(404, "Assessment not found.");
      }
      const row = await put({
        kind: "appeal",
        data: {
          reference,
          description: safeText(b.description, 4000),
          type: b.type === "Correction" ? "Correction" : "Appeal",
          status: "Received",
          steps: [
            "Received",
            "Independent reviewer assigned",
            "Evidence reviewed",
            "Outcome issued",
          ],
          submittedBy: user.userId,
        },
      });
      await audit("Appeal submitted", row.id);
      return json(row, 201);
    }
    if (path === "/api/workspaces/regulator" && method === "GET") {
      const grant = requireRole(grants, "regulator");
      const cases = (await list("case")).filter(
        (row) =>
          !row.data.example &&
          (grant.scope === "*" || row.data.jurisdiction === grant.scope),
      );
      return json({
        onboarding: await onboarding("regulator"),
        scope: grant.scope,
        records: cases,
        confirmations: (await list("confirmation")).filter(
          (row) => grant.scope === "*" || row.data.jurisdiction === grant.scope,
        ),
        audit: (
          await db
            .prepare(
              "SELECT action,target_id,created_at FROM audit_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
            )
            .bind(user.userId)
            .all()
        ).results,
      });
    }
    if (path === "/api/regulator/confirm" && method === "POST") {
      const grant = requireRole(grants, "regulator"),
        b = await body(),
        row = await get(b.id);
      if (
        !row ||
        row.kind !== "case" ||
        row.data.example ||
        (grant.scope !== "*" && row.data.jurisdiction !== grant.scope)
      )
        throw new ApiError(404, "Record not found.");
      if (!safeText(b.reference) || !safeText(b.body))
        throw new ApiError(422, "Add the authority name and source reference.");
      if (
        !["Confirmed", "Declined"].includes(b.authority) ||
        !["Confirmed", "Not confirmed"].includes(b.accreditation)
      )
        throw new ApiError(422, "Choose the confirmation status.");
      await put({
        kind: "confirmation",
        scope: row.scope,
        data: {
          caseId: row.id,
          institution: row.data.subject,
          jurisdiction: row.data.jurisdiction,
          scope: row.data.scope,
          authority: b.authority,
          accreditation: b.accreditation,
          body: safeText(b.body),
          reference: safeText(b.reference),
          recordedAt: time,
          recordedBy: user.userId,
        },
      });
      const publicRecord = await get(`VDC-VER-${row.id}`);
      if (publicRecord?.kind === "seal")
        await put({
          ...publicRecord,
          owner: publicRecord.owner_id,
          data: {
            ...publicRecord.data,
            status:
              b.authority === "Declined"
                ? "Under review"
                : publicRecord.data.status,
            authority:
              b.authority === "Declined"
                ? "Authority confirmation declined"
                : publicRecord.data.authority,
            accreditation:
              b.accreditation === "Confirmed"
                ? `Confirmation recorded by ${safeText(b.body)}`
                : "Not confirmed",
            regulatoryRecognition: `Recorded: ${safeText(b.body)} · ${safeText(b.reference)}`,
          },
        });
      await audit("Regulatory confirmation recorded", row.id, row.scope);
      return json({ ok: true });
    }
    throw new ApiError(404, "Route not found.");
  } catch (error) {
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    console.error("VeriDoc API failure", error?.message);
    return json({ error: "Service unavailable. Try again." }, 503);
  }
}
