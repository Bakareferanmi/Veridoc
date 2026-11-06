import vinext from "vinext";
import { defineConfig } from "vite";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { configureToolEnvironment } from "./scripts/tool-environment.mjs";
import { sites } from "./scripts/vite/sites-vite-plugin";
import { connectorPreview } from "./scripts/vite/connector-preview-plugin.mjs";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const standalone =
  process.env.VERIDOC_TARGET === "cloudflare" ||
  !existsSync(".openai/hosting.json");
const { d1, r2 } = standalone
  ? { d1: "DB", r2: null }
  : JSON.parse(readFileSync(".openai/hosting.json", "utf8"));

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  configureToolEnvironment(process.cwd());

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    define: {
      "import.meta.env.VERIDOC_STANDALONE": JSON.stringify(standalone),
    },
    server: {
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      vinext(),
      ...(!standalone
        ? [sites({ mockAuth: !managedLinux }), connectorPreview()]
        : []),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        ...(standalone
          ? {
              configPath:
                process.env.VERIDOC_CF_CONFIG ||
                (existsSync("wrangler.local.json")
                  ? "wrangler.local.json"
                  : "wrangler.jsonc"),
            }
          : {
              config: {
                ...localBindingConfig,
                ...(command === "serve"
                  ? {
                      services: [
                        {
                          binding: "CONNECTORS",
                          service: "sites-connector-preview",
                          entrypoint: "ConnectorPreview",
                        },
                      ],
                    }
                  : {}),
              },
            }),
        ...(!standalone && command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./scripts/connector-preview/worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
      {
        name: "veridoc-production-files",
        apply: "build",
        closeBundle: {
          order: "post",
          sequential: true,
          handler() {
            const directory = "dist/server";
            if (!existsSync(directory)) return;
            for (const name of readdirSync(directory))
              if (name.startsWith(".dev.vars") || name.startsWith(".env"))
                rmSync(`${directory}/${name}`, { force: true });
          },
        },
      },
    ],
  };
});
