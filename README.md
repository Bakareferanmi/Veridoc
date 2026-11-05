# VERIDOC React portal

A React + Vite conversion of the supplied `veridoc-portal.html`. The original navy/teal design, fonts, responsive layouts, system dark mode and nine screens are retained.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Deploy the `dist/` directory to any static host. Navigation uses URL fragments, so no server-side routing fallback is required.

## Project structure

- `src/App.jsx`: role-aware navigation and page-session share previews.
- `src/pages/`: verification, institution, reviewer, seal, references, appeals, holder, sign-in and regulator screens.
- `src/components/UI.jsx`: shared banners, cards, QR codes, seal, details and audit entries.
- `src/data.js`: original illustrative records and rubric data.
- `src/lib/assessment.js`: grading rules, QR reference parsing and date helpers.
- `src/styles.css`: original styling plus React accessibility and layout fixes.

## Prototype scope

This is a frontend prototype with illustrative records. Sign-in opens a role locally using a sample email; no password is requested and the email is not authenticated or submitted. No backend, database or issuer integration is included. Client-side role navigation is not a security boundary.

Changes remain in memory during navigation and reset on refresh or sign-out. Generated share links demonstrate selected fields, consent, expiry and revocation within the current page session. They do not work across devices or fresh tabs. Real sharing requires server storage and access controls.

Reference lookups match the original sample register. Report downloads contain a clearly labeled text summary of the selected sample outcome. QR scanning reads credential references locally using the camera with browser permission; camera access stops on leaving the screen. Seal and share previews use valid generated QR codes. Uploaded files stay local; document OCR and issuer matching are not implemented. A reference found in a filename can prefill the lookup, but is never treated as a verified document.

Review scoring enforces category thresholds and mandatory gates. Failed mandatory gates block recording a grade and allow escalation to a second reviewer. The included tests cover these decision rules and QR reference extraction.

## Motion and usability

The interface includes staggered page entrances, a sliding method indicator, animated verification results and check marks, hover/press feedback, and dismissible action notifications. All animation and smooth scrolling respect `prefers-reduced-motion`.

Light/dark selection is saved as a local display preference. Demo data remains in memory. Mobile workspaces use a four-item bottom navigation with a dismissible More panel. Keyboard focus follows page navigation and explicit verification submissions. Reference entry accepts pasted QR URLs, shows inline validation, and keeps the last checked reference separate from unfinished edits. The institution register supports text search, status filters and an empty state. Workspace handoff remembers the requested screen when the selected role can open it.
