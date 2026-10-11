# Home 360

A privacy-first, independent web demo for exploring a home-renovation planning workflow. This is original code; it does not decompile, copy, or redistribute other products' code, assets, models, or private APIs.

## Run locally

Open `index.html` in a browser, or serve the repository over localhost:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. The optional video preview uses a browser-local object URL. The file is not uploaded by this demo. This version does not activate a camera automatically.

## Demo scope

- English-language, three-step responsive web flow.
- Style, budget, location, and priority inputs.
- Add and remove rooms with user-entered approximate areas.
- Optional local video preview after explicit consent; no automatic analysis, upload, or server storage.
- Deterministic conceptual plan with visible assumptions and warnings.
- Print-to-PDF via the browser.

## Not implemented

This is a UI and workflow prototype, not the full product. It does not infer dimensions from video, understand images, create a measured floor plan, generate visual redesigns, learn preferences from feedback, validate construction feasibility, or provide a current local price estimate. The sample rate ranges are fictional and only demonstrate the interface; do not use them to budget or contract a real renovation.

## Deploy

The static site can be hosted on GitHub Pages or another static host. GitHub Pages must be enabled in the repository's Settings → Pages. The included workflow publishes the repository root on pushes to `main` once Pages is configured. Check the Actions run and Pages settings for the actual published address; a code commit alone does not prove a live deployment.

## Product principles

- Privacy-first: do not upload a home video without explicit, informed opt-in.
- Evidence-aware: distinguish user-entered measurements, model inferences, and verified facts.
- Professional review: flag structure, hidden services, permits, and final quotes as requiring qualified review.
- Independent implementation: use public documentation and authorized integrations rather than reverse engineering third-party apps.
