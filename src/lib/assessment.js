export function assess(scores, gates) {
  const total = scores.reduce((sum, value) => sum + value, 0);
  const blocked = [0, 1, 3, 4].some((index) => !gates[index]);
  const reasons = [];
  let grade = 0;
  if (blocked) reasons.push("Gate failed. Second review required.");
  else if (scores[0] < 15 || total < 50)
    reasons.push(
      scores[0] < 15 ? "Identity needs at least 15/25." : "Minimum total: 50.",
    );
  else {
    grade = 1;
    if (!gates[2]) reasons.push("Authority unconfirmed. Maximum: Grade 1.");
    else if (scores[1] < 18 || total < 70)
      reasons.push("Grade 2: authority ≥18/25 and total ≥70.");
    else {
      grade = 2;
      if (total >= 85 && scores[2] >= 15 && scores[3] >= 10 && scores[4] >= 6)
        grade = 3;
      else
        reasons.push(
          "Grade 3: total ≥85; integrity ≥15; governance ≥10; security ≥6.",
        );
    }
  }
  return { total, grade, blocked, reasons };
}
export const now = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const today = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export function referenceFromText(text) {
  return text.match(/VDC-CR-\d+/i)?.[0].toUpperCase() ?? null;
}
