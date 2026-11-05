export const DATA = {
  verified: {
    cls: "s-ok",
    ic: "✓",
    title: "Verified",
    msg: "Matches the issuer’s record.",
    cred: "Confined Space Safety Certificate",
    holder: "A. Okonkwo",
    ref: "VDC-CR-48210",
    issued: "12 Mar 2026",
    expiry: "12 Mar 2028",
    axes: [
      [
        "Institutional identity",
        "Registration and site review",
        "Verified",
        "ok",
      ],
      [
        "Issuing authority",
        "Short-course certificates, Nigeria",
        "Verified",
        "ok",
      ],
      ["Accreditation", "Not claimed by issuer", "Not claimed", "neutral"],
      ["Credential record", "Matches issuer register", "Verified", "ok"],
    ],
    src: "Issuer register, secure portal query",
  },
  expired: {
    cls: "s-warn",
    ic: "!",
    title: "Verified, expired",
    msg: "Record matched. Credential expired.",
    cred: "Working at Height Certificate",
    holder: "T. Adeyemi",
    ref: "VDC-CR-30977",
    issued: "05 Jun 2023",
    expiry: "05 Jun 2026",
    axes: [
      [
        "Institutional identity",
        "Registration and site review",
        "Verified",
        "ok",
      ],
      [
        "Issuing authority",
        "Short-course certificates, Nigeria",
        "Verified",
        "ok",
      ],
      ["Accreditation", "Not claimed by issuer", "Not claimed", "neutral"],
      ["Credential record", "Matches issuer register", "Expired", "warn"],
    ],
    src: "Issuer register, secure portal query",
  },
  mismatch: {
    cls: "s-warn",
    ic: "≠",
    title: "Mismatch",
    msg: "Details differ. Review needed.",
    cred: "Site Supervisor Certificate",
    holder: "C. Eze (submitted) vs C. Ezeh (record)",
    ref: "VDC-CR-51302",
    issued: "20 Jan 2026",
    expiry: "None",
    axes: [
      [
        "Institutional identity",
        "Registration and site review",
        "Verified",
        "ok",
      ],
      [
        "Issuing authority",
        "Short-course certificates, Nigeria",
        "Verified",
        "ok",
      ],
      ["Accreditation", "Not claimed by issuer", "Not claimed", "neutral"],
      ["Credential record", "Holder name differs", "Review required", "warn"],
    ],
    src: "Issuer register, manual confirmation",
  },
  notfound: {
    cls: "s-neutral",
    ic: "?",
    title: "Not found",
    msg: "No match. Not proof of fraud.",
    cred: "Not available",
    holder: "Not available",
    ref: "VDC-CR-00000",
    issued: "Not available",
    expiry: "Not available",
    axes: [
      [
        "Institutional identity",
        "Issuer named on document",
        "Limited evidence",
        "warn",
      ],
      ["Issuing authority", "Not assessed", "Not established", "neutral"],
      ["Accreditation", "Not applicable", "Not applicable", "neutral"],
      ["Credential record", "No matching record", "Not found", "neutral"],
    ],
    src: "Public register search by reference and name",
  },
  unable: {
    cls: "s-neutral",
    ic: "–",
    title: "Unable to verify",
    msg: "Source unavailable. Try again later.",
    cred: "Pipe Fitting Level 2",
    holder: "M. Bello",
    ref: "VDC-CR-22418",
    issued: "Not available",
    expiry: "Not available",
    axes: [
      [
        "Institutional identity",
        "Issuer has not joined VERIDOC",
        "Not verified",
        "neutral",
      ],
      ["Issuing authority", "Not assessed", "Not established", "neutral"],
      ["Accreditation", "Not assessed", "Not applicable", "neutral"],
      [
        "Credential record",
        "Source unavailable",
        "Unable to verify",
        "neutral",
      ],
    ],
    src: "Issuer portal, no response",
  },
};

export const REG = [
  [
    "VDC-CR-48210",
    "A. Okonkwo",
    "Confined Space Safety",
    "12 Mar 2026",
    "Active",
  ],
  ["VDC-CR-30977", "T. Adeyemi", "Working at Height", "05 Jun 2023", "Expired"],
  ["VDC-CR-51302", "C. Ezeh", "Site Supervisor", "20 Jan 2026", "Active"],
];

export const CATS = [
  ["Identity and existence", 25],
  ["Issuing authority and scope", 25],
  ["Credential record integrity", 20],
  ["Governance and accountability", 15],
  ["Digital and security controls", 10],
  ["Transparency and renewal", 5],
];

export const GL = [
  "No unresolved impersonation, fabrication or concealment",
  "Identity sufficiently established",
  "Authority evidence matches the exact credential type and jurisdiction",
  "Accountable administrators named and rules accepted",
  "No open security or data-integrity incident",
];

export const GN = [
  "Profile Listed",
  "Identity Verified",
  "Issuing Authority Verified",
  "Assured Issuer",
];

export const PR = [
  {
    n: "ABC Technical Learning Centre",
    v: [22, 20, 16, 11, 6, 4],
    g: [1, 1, 1, 1, 1],
  },
  { n: "Kano Skills Hub", v: [17, 10, 12, 8, 3, 3], g: [1, 1, 0, 1, 1] },
  {
    n: "Northgate Training Services",
    v: [20, 18, 14, 9, 5, 3],
    g: [0, 1, 1, 1, 1],
  },
];

export const ST = {
  active: ["s-ok", "✓", "Active", "Current seal."],
  review: ["s-warn", "!", "Under review", "Grade and scope may change."],
  suspended: ["s-bad", "×", "Suspended", "Pending investigation."],
  expired: ["s-neutral", "–", "Expired", "Review overdue."],
};

export const RF = [
  {
    n: "R. Danjuma",
    o: "Example Skills Association",
    r: "Professional association",
    f: "Operates since 2019; delivers short courses at one site.",
    c: "None declared",
    d: "10 Feb 2026",
    v: 1,
  },
  {
    n: "K. Mensah",
    o: "Example Skills Association",
    r: "Professional association",
    f: "Attended certificate presentations in 2025.",
    c: "None declared",
    d: "11 Feb 2026",
    v: 1,
  },
  {
    n: "L. Abiola",
    o: "Example Community Trust",
    r: "Community organisation",
    f: "Has hosted joint workshops since 2022.",
    c: "Financial connection",
    d: "14 Feb 2026",
    v: 0,
  },
];

export const AS = [
  "Received",
  "Second reviewer assigned",
  "Additional evidence reviewed",
  "Outcome published",
];

export const AP = [
  { t: "Appeal a decision", a: "Issuing authority", s: 2, d: "20 Oct 2026" },
];

export const HC = [
  {
    t: "Confined Space Safety Certificate",
    i: "ABC Technical Learning Centre",
    iss: "12 Mar 2026",
    exp: "12 Mar 2028",
    h: "A. Okonkwo",
    st: "Verified, current",
  },
  {
    t: "Manual Handling Certificate",
    i: "ABC Technical Learning Centre",
    iss: "03 Apr 2026",
    exp: "03 Apr 2029",
    h: "A. Okonkwo",
    st: "Verified, current",
  },
  {
    t: "First Aid at Work Certificate",
    i: "ABC Technical Learning Centre",
    iss: "04 May 2023",
    exp: "04 May 2026",
    h: "A. Okonkwo",
    st: "Verified, expired",
  },
];

export const FLD = [
  ["Credential title", 1, "Credential", "t"],
  ["Issuing institution", 1, "Issuer", "i"],
  ["Issue date", 0, "Issued", "iss"],
  ["Expiry date", 1, "Expires", "exp"],
  ["Holder name", 0, "Holder", "h"],
];

export const SH = [
  {
    to: "Example Recruitment Ltd",
    p: "Employment check",
    f: "Status, title, issuer, expiry",
    e: "09 Nov 2026, 09:10",
    s: "Active",
  },
  {
    to: "Example University",
    p: "Education admission",
    f: "Status, title",
    e: "20 Oct 2026, 16:00",
    s: "Expired",
  },
];

export const HL = [
  ["Link viewed by Example Recruitment Ltd", "02 Nov 2026, 09:14"],
  ["Link created for Example Recruitment Ltd", "02 Nov 2026, 09:10"],
];

export const RL = [
  ["holder", "Credential holder", "Share proofs of your credentials"],
  [
    "institution",
    "Institution admin",
    "Manage your profile, register and appeals",
  ],
  ["reviewer", "Reviewer", "Assess evidence and record decisions"],
  ["regulator", "Regulator", "Confirm issuing authority and status"],
];

export const RQ = [
  {
    i: "ABC Technical Learning Centre",
    c: "short-course completion certificates",
    j: "Nigeria",
    b: "Registration record, site review, issuer record review",
    s: "",
  },
  {
    i: "Kano Skills Hub",
    c: "site supervisor certificates",
    j: "Nigeria",
    b: "Registration record, one independent reference",
    s: "",
  },
  {
    i: "Northgate Training Services",
    c: "construction safety licences",
    j: "Nigeria",
    b: "Self-declared, no licence evidence supplied",
    s: "",
  },
];
