import { assess } from "./assessment.js";
export const FRAMEWORK_VERSION = "2026.1";
export const FRAMEWORKS = {
  institution: {
    label: "Institutions",
    singular: "Institution",
    scope:
      "Institutional identity and authority for a named credential category.",
    categories: [
      ["Identity & existence", 25, "Registration and operating address."],
      [
        "Issuing authority",
        25,
        "Authority for the exact credential and jurisdiction.",
      ],
      [
        "Credential integrity",
        20,
        "Traceable records and revocation controls.",
      ],
      [
        "Governance",
        15,
        "Named administrators, complaints and accountability.",
      ],
      ["Security", 10, "Access control, MFA and data protection."],
      ["Renewal", 5, "Published scope, review dates and corrections."],
    ],
    grades: [
      "Listed",
      "Identity Verified",
      "Issuing Authority Verified",
      "Assured Issuer",
    ],
  },
  individual: {
    label: "Individuals",
    singular: "Individual",
    scope:
      "Identity, qualifications and professional claims. Not a judgement of personal worth.",
    categories: [
      ["Identity", 25, "Identity evidence matched to its source."],
      ["Qualifications", 25, "Qualifications confirmed with the issuer."],
      [
        "Professional standing",
        20,
        "Relevant credentials and registration status.",
      ],
      ["Accountability", 15, "Claim ownership and a correction route."],
      ["Data controls", 10, "Consent and access controls for shared records."],
      ["Renewal", 5, "Current records and scheduled rechecks."],
    ],
    grades: [
      "Listed",
      "Identity Verified",
      "Credentials Verified",
      "Assured Record",
    ],
  },
  business: {
    label: "Businesses",
    singular: "Business",
    scope: "Business identity and operating authority within a stated scope.",
    categories: [
      ["Business identity", 25, "Registration and operating location."],
      [
        "Operating authority",
        25,
        "Evidence for the named activity and jurisdiction.",
      ],
      ["Record integrity", 20, "Traceable business and credential records."],
      ["Governance", 15, "Accountable officers and dispute handling."],
      ["Security", 10, "Access controls and protection of records."],
      ["Renewal", 5, "Current disclosures and rechecks."],
    ],
    grades: [
      "Listed",
      "Identity Verified",
      "Operating Authority Verified",
      "Assured Organisation",
    ],
  },
};
export const GRADE_RULES = [
  {
    grade: 0,
    title: "Listed",
    criteria: "Profile received. Identity and authority are not verified.",
  },
  {
    grade: 1,
    title: "Identity verified",
    criteria: "Total ≥50; identity ≥15/25; mandatory gates passed.",
  },
  {
    grade: 2,
    title: "Authority / credentials verified",
    criteria:
      "Total ≥70; authority or qualification evidence ≥18/25; scope confirmed.",
  },
  {
    grade: 3,
    title: "Assured",
    criteria:
      "Total ≥85; integrity ≥15; governance ≥10; security ≥6. Independent second review required.",
  },
];
export const EVIDENCE_GATES = [
  "No unresolved fabrication or impersonation",
  "Identity sufficiently established",
  "Evidence matches the exact claim and jurisdiction",
  "Accountable person named; review rules accepted",
  "No unresolved security or record-integrity incident",
];
export function evaluateAssessment(kind, scores, gates, evidence = []) {
  if (!FRAMEWORKS[kind]) throw new Error("Unknown assessment framework.");
  if (
    !Array.isArray(scores) ||
    scores.length !== 6 ||
    scores.some(
      (v, i) =>
        !Number.isInteger(v) || v < 0 || v > FRAMEWORKS[kind].categories[i][1],
    )
  )
    throw new Error("Scores must fit the published rubric.");
  if (
    !Array.isArray(gates) ||
    gates.length !== 5 ||
    gates.some((v) => typeof v !== "boolean")
  )
    throw new Error("Complete all five gate checks.");
  const unsupported = scores.findIndex(
    (score, i) =>
      score > 0 &&
      !evidence.some(
        (item) =>
          item.category === i && item.verified && item.reference?.trim(),
      ),
  );
  if (unsupported !== -1)
    throw new Error(
      `Verify source evidence for ${FRAMEWORKS[kind].categories[unsupported][0]}.`,
    );
  return {
    ...assess(scores, gates),
    framework: kind,
    version: FRAMEWORK_VERSION,
  };
}
export const EXAMPLE_SEAL = {
  id: "VDC-NG-000123",
  verificationReference: "VDC-VER-2026-000123",
  institution: "ABC Technical Learning Centre",
  kind: "institution",
  grade: 2,
  status: "Active",
  verifiedAt: "2026-03-12",
  reviewAt: "2027-03-12",
  jurisdiction: "Nigeria",
  scope: "Short-course completion certificates only",
  identity: "Verified",
  authority: "Verified for the stated scope",
  accreditation: "Not claimed",
  regulatoryRecognition: "Not independently confirmed",
  example: true,
  frameworkVersion: FRAMEWORK_VERSION,
  evidence: [
    {
      name: "Registration record",
      source: "Registration record review",
      date: "2026-02-02",
    },
    { name: "Operating site", source: "Site review", date: "2026-02-12" },
    {
      name: "Independent reference",
      source: "Reference check",
      date: "2026-02-14",
    },
    {
      name: "Issuer register",
      source: "Credential record review",
      date: "2026-03-12",
    },
  ],
};
export const OPPORTUNITIES = [
  {
    id: "example-engineering",
    title: "Graduate engineering programme",
    type: "Graduate programme",
    location: "Lagos",
    tags: ["Engineering", "Entry level"],
    requirements:
      "Engineering qualification and a current professional profile.",
    example: true,
  },
  {
    id: "example-digital",
    title: "Digital skills fellowship",
    type: "Fellowship",
    location: "Remote",
    tags: ["Technology", "Training"],
    requirements: "Relevant project work and verified course records.",
    example: true,
  },
  {
    id: "example-mentor",
    title: "Professional mentor network",
    type: "Mentorship",
    location: "Nigeria",
    tags: ["Professional development"],
    requirements: "An up-to-date profile and stated learning goals.",
    example: true,
  },
];
