import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { handleApi } from "../../../server/service.mjs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  const user = await getChatGPTUser();
  return handleApi(request, {
    db: env.DB,
    user,
    ownerEmail:
      (env as unknown as Record<string, string>).VERIDOC_ADMIN_EMAIL || "",
  });
}
export { handle as GET, handle as POST };
