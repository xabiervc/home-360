# New Home

Flutter MVP for planning home renovations from a guided walkthrough, room measurements, and the homeowner's preferences.

## What this prototype does

- Captures project basics and preferences (budget, style, priorities, items to keep).
- Models rooms and their measurements.
- Produces a transparent, deterministic preliminary renovation plan with assumptions, cost ranges, and feasibility warnings.
- Keeps scanning, image analysis, 3D visualization, and provider integrations behind clear extension points.

This is an independent implementation. It does not decompile or reuse proprietary code from other apps. The generated plan is an estimate for exploration, not a certified construction project or quote. Structural changes, installations, permits, measurements, and final costs need validation by qualified professionals.

## Getting started

Install Flutter stable, then run:

```sh
flutter pub get
flutter analyze
flutter test
flutter run
```

## Current scope

The initial MVP is deliberately local-first and does not upload video or photos. Its first milestone validates the project/preferences/room/plan workflow before adding camera capture, room scanning, backend storage, or AI services.

## Roadmap

1. Guided video capture with explicit privacy controls.
2. Room/plan ingestion and measurement confirmation.
3. Preference learning from user feedback on proposals.
4. Editable floor plan and visual design alternatives.
5. Regional cost catalogue and professional review workflow.

## Architecture

- `lib/models/`: domain model and validation.
- `lib/services/`: deterministic plan generation with replaceable integrations.
- `lib/main.dart`: Flutter application and MVP interface.
- `test/`: unit tests.
