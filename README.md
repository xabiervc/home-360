# New Home

A privacy-first, independent web demo for exploring a home-renovation planning flow. This prototype is original code; it does not decompile, copy, or redistribute other products' code, assets, models, or private APIs.

## Run locally

Open `index.html` in a browser, or serve the repository over localhost:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The optional video preview uses a browser-local object URL. The file is never uploaded by this demo. Browsers require user permission and a secure context for live camera access; this version does not activate a camera automatically.

## Demo scope

- Spanish-language, three-step responsive web flow.
- Style, budget, location, and priority inputs.
- Add/remove rooms and user-entered approximate areas.
- Optional local video preview after explicit consent; no automatic analysis, upload, or server storage.
- Deterministic conceptual plan with visible assumptions and warnings.
- Print-to-PDF via the browser.

## Not implemented

This is a UI and workflow prototype, not the full product. It does not infer dimensions from video, understand images, create a measured floor plan, generate visual redesigns, learn preferences from feedback, validate construction feasibility, or provide a current local price estimate. The sample rate ranges are fictitious and are included only to demonstrate a user interface; do not use them to budget or contract a real renovation.

## Deploy

The static site can be hosted on GitHub Pages or any static host. GitHub Pages must be enabled in the repository's Settings → Pages. The included workflow builds and publishes the static root on pushes to `main` once Pages is configured. Check the Actions run and Pages settings for the actual published address; no live deployment is implied by a code commit.

## Product principles

- Privacy-first: never upload a home video without an explicit, informed opt-in.
- Evidence-aware: distinguish user-entered measurements, model inferences, and verified facts.
- Professional review: flag structure, hidden services, permits, and final quotes as requiring qualified review.
- Independent implementation: use public documentation and authorized integrations rather than reverse engineering third-party apps.
