# VeriDoc

React app for identity records, credential verification, evidence-based assessments and opportunities. The navy/teal design, shield, Trust Seal, Hugeicons and mobile onboarding are retained.

## Cloudflare deployment

The standalone application runs on **Cloudflare Workers + D1**, including registration, password sign-in and database-backed sessions. A custom domain is optional; the initial deployment uses `workers.dev`.

Use Node.js 24 and the repository's npm lockfile.

```sh
npm ci
npx wrangler login
npm run cf:setup
npm run cf:deploy
```

`cf:setup` selects the authenticated account when it has one account, reuses or creates `veridoc-db`, and writes `wrangler.local.json`. If you have multiple accounts, use `npm run cf:setup -- --account-id YOUR_ACCOUNT_ID`. This account-specific configuration is excluded from Git. The committed `wrangler.jsonc` contains a placeholder database ID for local builds; deployment refuses that placeholder.

`cf:deploy` builds the standalone Worker, applies pending D1 migrations, publishes the app and creates a random authentication secret if none exists. It never prints the secret or rotates an existing one. Deployment requires your Cloudflare login on the computer running the command. It does not deploy through ChatGPT or Vercel.

Create your own account at the deployed URL. Open **Workspace → Account details**, copy your User ID, and run:

```sh
npm run cf:admin -- --user-id YOUR_ACCOUNT_USER_ID
```

This verifies that the account exists in the selected database and assigns the owner through the server-only `VERIDOC_ADMIN_USER_ID` secret. Refresh Workspace afterward. An email address entered at registration never automatically becomes an administrator. Never grant an ID supplied by someone else without checking the intended account.

For later code updates, pull main, run `npm ci`, then `npm run cf:deploy`. Keep `wrangler.local.json` on your deployment computer. An existing Vercel project is left intact; `vercel.json` stops new Git-triggered Vercel deployments for this Cloudflare application.

### Local development and checks

```sh
npm run cf:dev
```

This creates an ignored, local `.dev.vars` file with a random development secret if it is missing. Local D1 storage is separate from the hosted database. After a first build, apply local migrations once:

```sh
npx wrangler d1 migrations apply DB --local --config wrangler.jsonc
```

```sh
npm test
npm run cf:build
npm run cf:check
```

`cf:check` runs the compiled Worker against an isolated D1 runtime. It checks registration, signed sessions, role enforcement, profile persistence, sign-out and rejection of forged preview identity headers. It does not contact your Cloudflare account or modify a hosted database.

### Domain and secrets

Add your domain to the Worker in Cloudflare when ready. Set `vars.APP_ORIGIN` in `wrangler.local.json` to the exact HTTPS origin and redeploy. Metadata follows the request host. Keep secrets in Cloudflare Worker secrets; never put `BETTER_AUTH_SECRET` or authentication credentials in source or client variables.

No email delivery provider is configured yet. Registration and password sign-in work; email confirmation and password-reset emails are not enabled. The UI identifies unconfirmed email, and sign-in does not count as identity or credential verification. Configure a verified sender and delivery provider before enabling those email workflows. Passwords are hashed by Better Auth; sessions use HttpOnly cookies, origin checks, revocation and D1-backed rate limiting.

## Product behavior

- Trust Seal records include grade, exact scope, unique reference, verification/review dates, source evidence, QR and share links. Identity verification, authority, accreditation and regulatory recognition remain distinct.
- Versioned assessment frameworks cover institutions, individuals and businesses. Positive scores require source evidence. Failed gates block grading; Grade 3 requires a different assigned reviewer. Subscription inputs never enter grading.
- Dedicated holder, institution, reviewer and regulator dashboards use server-assigned roles and record-level authorization.
- Profiles, qualifications, issuer-submitted credentials, assessment requests, decisions, appeals, saved opportunities, proof links and onboarding acknowledgements persist in D1.
- New accounts receive holder access. Privileged roles require administrator approval and affiliation checks. Regulator access is scoped by jurisdiction.
- Role-specific setup checklists show one next action. Access requests explain waiting states and show administrator review notes.
- Proof sharing requires consent, reveals selected fields, expires and can be revoked. A submitted credential is not automatically verified.

## Existing private preview

The private ChatGPT preview remains separate. Its build retains the tracked `.openai/hosting.json`, Sites request-context authentication and its own managed D1 database. The standalone Cloudflare target neither needs that private file nor trusts its identity headers. Preview users and records are not automatically moved into your Cloudflare account; any future migration must map identities explicitly.

`npm run build` uses the preview integration when that private manifest exists, or the standalone Cloudflare configuration in a clean GitHub clone. `npm run cf:build` always builds standalone Cloudflare. Preview publication does not constitute deployment to your own Cloudflare account.

## Current limits

The example register and institution are illustrative. Live issuer, government and accreditation APIs, file uploads and OCR are not connected. Reviewers record source checks; the software does not independently confer regulatory recognition.

Opportunities are labeled examples with persistent saving. A live feed and applications are not connected. The Visibility plan records interest only; billing and paid placement are not connected.

Appeals have durable intake and a timeline. Independent appeal assignment, adjudication and outcome publication remain pending. Grade 3 independent second review is implemented for assessment cases.

## Source map

- `app/api/[...path]/route.ts`: selects the compiled authentication target and mounts API operations.
- `server/auth.mjs`: standalone Better Auth configuration.
- `server/service.mjs`, `server/policy.mjs`: persisted operations, roles and ownership checks.
- `scripts/cloudflare.mjs`: account setup, build, deployment and owner assignment.
- `src/lib/frameworks.js`, `assessment.js`: evidence-based grading.
- `src/screens/`, `src/components/`: screens, onboarding and sign-in.
- `db/schema.ts`, `drizzle/`: schema and append-only migrations.
- `public/`: favicons, Apple icon and Open Graph assets.
