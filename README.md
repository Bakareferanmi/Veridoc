# VeriDoc

React application for identity records, credential verification, evidence-based assessments and opportunities. The navy/teal visual system, shield logo, Trust Seal, Hugeicons and reduced-motion support are retained.

## What is implemented

- Institutional Trust Seal pages with grade, precise scope, verification reference, verification/review dates, source evidence, QR code and share link. The original seal remains visually intact.
- Versioned frameworks for institutions, individuals and businesses. Scored categories require source evidence. Failed gates block grading, and Grade 3 requires a different assigned reviewer.
- Dedicated holder, institution, reviewer and regulator workspaces.
- ChatGPT authentication on Sites; database-assigned roles and per-operation server authorization. New accounts receive holder access only. Role requests require administrator approval.
- Persistent profiles, qualifications, institution profiles, issuer-submitted credentials, review requests, decisions, appeal intake, saved opportunities and consent-based proof sharing in Cloudflare D1.
- Scope-limited institution and regulator access; user-owned private records; self-review prevention; locked completed decisions; audit events.
- Expiring proof links return selected fields only and can be revoked. Public access follows the hosting audience.
- Subscription interest is stored separately from assessments. No subscription, visibility or payment fields enter grading.

## Run

Node.js 24 is recommended (the tests use `node:sqlite`).

```sh
npm ci
npm run db:generate
npm run build
```

Apply each pending migration to the local database once, in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_overconfident_shotgun.sql
```

```sh
npm run dev
npm test
```

This project now uses Vinext's React/Next-compatible application router with a Cloudflare Worker, rather than a static-only Vite deployment. The original screen components live in `src/screens/` to avoid accidental Pages Router routes.

## Authentication and administration

Hosted identity comes from Sites' verified request context through `app/chatgpt-auth.ts`. Sign-in uses the platform-owned `/signin-with-chatgpt` route. The application does not accept a chosen browser role or client-supplied identity as authorization.

`VERIDOC_ADMIN_EMAIL` is configured as a server-only hosting secret. It bootstraps the site owner's administrative workspaces. Never expose this value through client environment variables. Other users receive holder access and request additional roles; administrators must verify an applicant's organisation and authority before granting privileged access. Regulator grants carry a jurisdiction. Application role grants do not themselves establish statutory recognition.

Local portable preview can use the starter's loopback-only mock sign-in. Managed preview does not simulate authentication. Production never ships the development sign-in mock. Local and hosted D1 databases are separate.

The Sites manifest provisions the `DB` binding and applies committed, schema-only migrations during publication. If deploying outside Sites, provide the same Worker/D1 runtime and replace the authentication adapter with a verified provider integration that preserves the server-side role and ownership checks. A static export cannot provide the authenticated workspaces.

## Limits and planned integrations

The example institution and register are explicitly illustrative. Live issuer, government and accreditation APIs are not connected. Reviewers record source checks; the software does not automatically authenticate documents or confer regulatory recognition. File uploads/OCR are not connected; current review requests use source references.

Opportunities are labeled examples, with persistent saving; a live feed and applications are not connected. The Visibility plan records interest only; billing and paid placement are not connected. Both plans use identical assessment rules.

Appeals are stored with an intake timeline and evidence. Independent assignment, case adjudication and outcome publication for appeals are the next workflow step; the interface does not claim an appeal has been reviewed. Grade 3 second-review assignment and confirmation are implemented separately for assessment cases.

## Main files

- `app/`: authenticated server adapter, metadata and application entry.
- `server/service.mjs`: API operations and storage.
- `server/policy.mjs`: identity, authorization, ownership and origin checks.
- `server/service.test.mjs`: integration tests using an isolated SQLite database.
- `src/lib/frameworks.js`: versioned assessment criteria and example seal.
- `src/lib/assessment.js`: bounded, payment-independent grading rules.
- `src/screens/`: public pages and dedicated dashboards.
- `db/schema.ts`, `drizzle/`: schema and append-only migrations.
- `public/`: favicons, Apple icon and Open Graph image with editable SVG source.

Metadata uses the current hosted origin. Update `metadataBase` in `app/layout.tsx` when moving to another domain. Social crawlers and unauthenticated third-party verification need a publicly accessible page; the current private site's audience is preserved.
