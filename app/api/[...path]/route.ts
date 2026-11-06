import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { handleApi } from "../../../server/service.mjs";
import { createAuth, sessionIdentity } from "../../../server/auth.mjs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const standalone = import.meta.env.VERIDOC_STANDALONE === true;
  const path = new URL(request.url).pathname;
  try {
    if (standalone && env.VERIDOC_AUTH_MODE !== "standalone")
      throw new Error("Standalone authentication binding is required.");
    if (standalone && path.startsWith("/api/auth/"))
      return createAuth(env, request).handler(request);
    const user = standalone
      ? sessionIdentity(
          request.headers.has("cookie")
            ? await createAuth(env, request).api.getSession({
                headers: request.headers,
              })
            : null,
        )
      : await getChatGPTUser();
    const response = await handleApi(request, {
      db: env.DB,
      user,
      ownerUserId: standalone ? env.VERIDOC_ADMIN_USER_ID || "" : "",
      ownerEmail: standalone
        ? ""
        : (env as unknown as Record<string, string>).VERIDOC_ADMIN_EMAIL || "",
    });
    if (path === "/api/session") {
      return Response.json(
        {
          ...(await response.json()),
          authMode: standalone ? "standalone" : "chatgpt",
        },
        { status: response.status, headers: response.headers },
      );
    }
    return response;
  } catch {
    return Response.json(
      { error: "Sign-in service unavailable. Please try again." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
export { handle as GET, handle as POST };
