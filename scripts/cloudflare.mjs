import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const [command, ...args] = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const configFile = path.join(root, "wrangler.local.json");
const parsedTemplate = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  readFileSync("wrangler.jsonc", "utf8"),
);
if (parsedTemplate.error)
  throw new Error("Invalid wrangler.jsonc configuration.");
const template = parsedTemplate.config;
const wrangler = path.join(root, "node_modules/wrangler/bin/wrangler.js");
function run(argv, { capture = false, input, env = {} } = {}) {
  const result = spawnSync(process.execPath, argv, {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: capture
      ? ["pipe", "pipe", "pipe"]
      : input
        ? ["pipe", "inherit", "inherit"]
        : "inherit",
    input,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0 || result.error) {
    if (capture)
      process.stderr.write(result.stderr || "Cloudflare command failed.\n");
    throw new Error(
      "Command failed. Resolve the reported error before continuing.",
    );
  }
  return result.stdout;
}
const cf = (argv, options) => run([wrangler, ...argv], options);
function readConfig() {
  if (!existsSync(configFile)) throw new Error("Run npm run cf:setup first.");
  const config = JSON.parse(readFileSync(configFile, "utf8"));
  const binding = config.d1_databases?.find((item) => item.binding === "DB");
  if (
    !binding ||
    binding.database_id === template.d1_databases[0].database_id ||
    !/^[a-f0-9-]{36}$/i.test(binding.database_id)
  )
    throw new Error("The D1 database ID is not configured.");
  return config;
}
function setup() {
  // Never create duplicate databases when a previous setup already succeeded.
  if (existsSync(configFile)) {
    readConfig();
    console.log("Cloudflare configuration is ready.");
    return;
  }
  let identity;
  try {
    identity = JSON.parse(cf(["whoami", "--json"], { capture: true }));
  } catch {
    throw new Error(
      "Sign in on this computer with npx wrangler login, then repeat npm run cf:setup.",
    );
  }
  const accounts = identity.accounts || [];
  const requestedAccount = args.includes("--account-id")
    ? option("--account-id")
    : process.env.CLOUDFLARE_ACCOUNT_ID;
  const selected = requestedAccount
    ? accounts.find((item) => item.id === requestedAccount)
    : accounts.length === 1
      ? accounts[0]
      : null;
  if (!selected)
    throw new Error(
      "Choose an account from npx wrangler whoami, then run npm run cf:setup -- --account-id YOUR_ACCOUNT_ID.",
    );
  const accountEnv = { CLOUDFLARE_ACCOUNT_ID: selected.id };
  const databases = JSON.parse(
    cf(["d1", "list", "--json"], { capture: true, env: accountEnv }),
  );
  const existing = databases.find((item) => item.name === "veridoc-db");
  let databaseId = existing?.uuid || existing?.id;
  if (!databaseId) {
    const created = cf(
      ["d1", "create", "veridoc-db", "--update-config=false"],
      { capture: true, env: accountEnv },
    );
    databaseId = created.match(
      /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/i,
    )?.[0];
    if (!databaseId)
      throw new Error(
        "Database creation returned no ID. Check npx wrangler d1 list before retrying.",
      );
  }
  const config = {
    ...template,
    account_id: selected.id,
    d1_databases: [{ ...template.d1_databases[0], database_id: databaseId }],
  };
  writeFileSync(configFile, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
  console.log(
    "D1 is connected. Your account configuration is excluded from Git.",
  );
}
function build() {
  run([path.join(root, "node_modules/vinext/dist/cli.js"), "build"], {
    env: {
      VERIDOC_TARGET: "cloudflare",
      VERIDOC_CF_CONFIG: existsSync(configFile)
        ? configFile
        : path.join(root, "wrangler.jsonc"),
    },
  });
}
function deploy() {
  readConfig();
  build();
  const built = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
  if (built.vars?.VERIDOC_AUTH_MODE !== "standalone")
    throw new Error("Refusing to publish a preview-only authentication build.");
  cf(["d1", "migrations", "apply", "DB", "--remote", "--config", configFile]);
  cf(["deploy", "--config", "dist/server/wrangler.json"]);
  const secrets = JSON.parse(
    cf(["secret", "list", "--config", "dist/server/wrangler.json"], {
      capture: true,
    }),
  );
  if (!secrets.some((item) => item.name === "BETTER_AUTH_SECRET")) {
    cf(["secret", "bulk", "--config", "dist/server/wrangler.json"], {
      input: JSON.stringify({
        BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
      }),
    });
  }
  console.log(
    "Deployment finished. Open the workers.dev URL above, create your account, then use cf:admin with its User ID.",
  );
}
function admin() {
  readConfig();
  const id = args.includes("--user-id") ? option("--user-id") : "";
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id))
    throw new Error(
      "Use npm run cf:admin -- --user-id YOUR_ACCOUNT_USER_ID. Find it in Workspace → Account details after signing in.",
    );
  const result = JSON.parse(
    cf(
      [
        "d1",
        "execute",
        "DB",
        "--remote",
        "--config",
        configFile,
        "--json",
        "--command",
        `SELECT id FROM auth_user WHERE id = '${id}'`,
      ],
      { capture: true },
    ),
  );
  if (!result.some((item) => item.results?.some((row) => row.id === id)))
    throw new Error(
      "That account does not exist in the selected VeriDoc database.",
    );
  cf(["secret", "bulk", "--config", configFile], {
    input: JSON.stringify({ VERIDOC_ADMIN_USER_ID: id }),
  });
  console.log(
    "Owner account assigned. Refresh Workspace to load your administrative roles.",
  );
}
try {
  switch (command) {
    case "setup":
      setup();
      break;
    case "build":
      build();
      break;
    case "deploy":
      deploy();
      break;
    case "admin":
      admin();
      break;
    case "dev": {
      if (!existsSync(".dev.vars"))
        writeFileSync(
          ".dev.vars",
          `BETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}\n`,
          { mode: 0o600 },
        );
      run(
        [
          path.join(root, "node_modules/vite/bin/vite.js"),
          "--host",
          "0.0.0.0",
          ...args,
        ],
        { env: { VERIDOC_TARGET: "cloudflare" } },
      );
      break;
    }
    default:
      throw new Error("Choose setup, build, dev, deploy or admin.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
