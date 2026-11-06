export const ROLES = ["holder", "institution", "reviewer", "regulator"];
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireIdentity(user) {
  if (!user?.userId || !user?.email)
    throw new ApiError(401, "Sign in to continue.");
  return user;
}
export function requireRole(grants, role) {
  const grant = grants.find((g) => g.role === role);
  if (!grant)
    throw new ApiError(403, "This role has not been assigned to your account.");
  return grant;
}
export function requireOwner(record, user) {
  if (!record || record.owner_id !== user.userId)
    throw new ApiError(404, "Record not found.");
  return record;
}
export function checkOrigin(request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new ApiError(403, "Cross-site request rejected.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "Send JSON data.");
  }
}
export function canReview(record, user, grants) {
  if (record.data.submittedBy === user.userId) return false;
  if (grants.some((g) => g.role === "institution" && g.scope === record.scope))
    return false;
  return true;
}
export function safeText(value, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
