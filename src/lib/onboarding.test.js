import test from "node:test";
import assert from "node:assert/strict";
import { setupSteps } from "./onboarding.js";
import { FRAMEWORK_VERSION } from "./frameworks.js";

test("holder setup follows saved profile, qualifications and assessment activity", () => {
  const data = {
    profile: { name: "Alice" },
    qualifications: [],
    assessments: [],
  };
  assert.equal(
    setupSteps("holder", data).find((step) => !step.done).id,
    "profile",
  );
  data.profile = { profession: "Engineer", location: "Lagos" };
  assert.equal(
    setupSteps("holder", data).find((step) => !step.done).id,
    "qualifications",
  );
  data.qualifications.push({ id: "q1" });
  assert.equal(
    setupSteps("holder", data).find((step) => !step.done).id,
    "assessment",
  );
  data.assessments.push({ id: "c1" });
  assert.ok(setupSteps("holder", data).every((step) => step.done));
});

test("an institution’s rejected decision completes setup without implying a seal", () => {
  const data = {
    profile: { scope: "Short courses" },
    cases: [{ data: { status: "Decision recorded", grade: 0 } }],
    seals: [],
  };
  assert.ok(setupSteps("institution", data).every((step) => step.done));
});

test("example cases cannot complete reviewer setup and an empty queue explains waiting", () => {
  const data = {
    onboarding: { policyVersion: FRAMEWORK_VERSION },
    cases: [{ data: { example: true, status: "Decision recorded" } }],
    queue: [],
    secondQueue: [],
  };
  const steps = setupSteps("reviewer", data);
  assert.equal(steps.find((step) => !step.done).id, "queue");
  assert.match(steps[1].note, /No eligible cases/);
  assert.equal(steps[2].done, false);
});

test("a changed regulator scope or framework needs a new acknowledgement", () => {
  const data = {
    scope: "Nigeria",
    onboarding: { confirmedScope: "Ghana", policyVersion: "old" },
    records: [],
    confirmations: [],
  };
  const steps = setupSteps("regulator", data);
  assert.equal(steps[0].done, false);
  assert.equal(steps[1].done, false);
  assert.match(steps[2].note, /No records/);
});
