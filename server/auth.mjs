import { betterAuth } from "better-auth";

// A fresh instance uses this request's D1 binding. No visitor identity is read
// from headers on a standalone deployment.
export function createAuth(env, request) {
  if (!env.DB || !env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
    throw new Error("Authentication storage or secret is not configured.");
  const origin = env.APP_ORIGIN || new URL(request.url).origin;
  return betterAuth({
    appName: "VeriDoc",
    baseURL: origin,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    user: { modelName: "auth_user" },
    account: { modelName: "auth_account" },
    verification: { modelName: "auth_verification" },
    session: {
      modelName: "auth_session",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      // No email provider is configured yet. Unverified email never grants
      // privileged roles; the owner is assigned by an explicit user ID.
      requireEmailVerification: false,
    },
    trustedOrigins: [origin],
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "auth_rate_limit",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: "veridoc",
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
  });
}

export function sessionIdentity(session) {
  return session?.user
    ? {
        userId: session.user.id,
        email: session.user.email,
        displayName: session.user.name,
        emailVerified: session.user.emailVerified === true,
      }
    : null;
}
