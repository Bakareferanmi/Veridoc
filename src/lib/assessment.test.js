import test from "node:test";
import assert from "node:assert/strict";
import { assess, referenceFromText } from "./assessment.js";
const all = [true, true, true, true, true];
test("mandatory gates override even a perfect score", () => {
  for (const gate of [0, 1, 3, 4]) {
    const gates = [...all];
    gates[gate] = false;
    const result = assess([25, 25, 20, 15, 10, 5], gates);
    assert.equal(result.blocked, true);
    assert.equal(result.grade, 0);
  }
});
test("authority gate caps the grade at one", () => {
  assert.equal(
    assess([25, 25, 20, 15, 10, 5], [true, true, false, true, true]).grade,
    1,
  );
});
test("grade boundaries and category minimums are enforced", () => {
  assert.equal(assess([14, 25, 20, 15, 10, 5], all).grade, 0);
  assert.equal(assess([22, 20, 16, 11, 6, 4], all).grade, 2);
  assert.equal(assess([25, 25, 15, 10, 6, 4], all).grade, 3);
  assert.equal(assess([25, 25, 20, 5, 10, 5], all).grade, 2);
  assert.equal(assess([25, 17, 20, 15, 10, 5], all).grade, 1);
});
test("QR text accepts references without navigating to untrusted URLs", () => {
  assert.equal(
    referenceFromText("https://example.com/#verify?ref=vdc-cr-48210"),
    "VDC-CR-48210",
  );
  assert.equal(referenceFromText("https://unrelated.example"), null);
});
