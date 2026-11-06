import { FRAMEWORK_VERSION } from "./frameworks.js";

const hasText = (value) => Boolean(value?.trim());
export function setupSteps(role, data) {
  const policyRead = data.onboarding?.policyVersion === FRAMEWORK_VERSION;
  switch (role) {
    case "holder":
      return [
        {
          id: "profile",
          label: "Complete your profile",
          done:
            hasText(data.profile?.profession) &&
            hasText(data.profile?.location),
          action: "Edit profile",
        },
        {
          id: "qualifications",
          label: "Add a qualification",
          done: data.qualifications.length > 0,
          action: "Add qualification",
        },
        {
          id: "assessment",
          label: "Request an assessment",
          done: data.assessments.length > 0,
          action: "Request assessment",
        },
      ];
    case "institution":
      return [
        {
          id: "profile",
          label: "Define your institution and scope",
          done: hasText(data.profile?.scope),
          action: "Complete profile",
        },
        {
          id: "assessment",
          label: "Submit evidence for review",
          done: data.cases.length > 0,
          action: "Submit evidence",
        },
        {
          id: "seal",
          label: "Receive a review decision",
          done:
            data.seals.length > 0 ||
            data.cases.some((row) => row.data.status === "Decision recorded"),
          action: "View request",
          note: "An independent reviewer checks your evidence. Submitting a request does not grant a grade.",
        },
      ];
    case "reviewer": {
      const cases = data.cases.filter((row) => !row.data.example);
      const available =
        cases.length > 0 ||
        data.queue.length > 0 ||
        data.secondQueue?.length > 0;
      return [
        {
          id: "policy",
          label: "Review the assessment policy",
          done: policyRead,
          action: "Review policy",
        },
        {
          id: "queue",
          label: "Take an eligible case",
          done: cases.length > 0,
          action: available ? "Open cases" : "Check for cases",
          note: !available
            ? "No eligible cases yet. Assigned cases and the available queue will appear here."
            : "Only take cases you can review independently.",
        },
        {
          id: "decision",
          label: "Record a source-backed decision",
          done: cases.some((row) => row.data.status === "Decision recorded"),
          action: "Review evidence",
        },
      ];
    }
    case "regulator":
      return [
        {
          id: "scope",
          label: "Confirm your assigned jurisdiction",
          done: data.onboarding?.confirmedScope === data.scope,
          action: "Check jurisdiction",
        },
        {
          id: "policy",
          label: "Review the assessment policy",
          done: policyRead,
          action: "Review policy",
        },
        {
          id: "confirmation",
          label: "Record a source confirmation",
          done: data.confirmations.length > 0,
          action: data.records.length ? "Open records" : "Check for records",
          note: !data.records.length
            ? "No records in your assigned jurisdiction yet. Check again when a request arrives."
            : "Confirm authority and accreditation separately, using a source reference.",
        },
      ];
    default:
      return [];
  }
}

export const ACCESS_REASONS = {
  institution:
    "An administrator checks your organisation and authority to manage its records.",
  reviewer:
    "An administrator checks your review experience and independence before assigning cases.",
  regulator:
    "An administrator checks your affiliation, oversight authority and jurisdiction.",
};
