# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server at localhost:5173
npm run build        # Build to client/dist/ (consumed by Capacitor)
npm run preview      # Serve the production build at localhost:4173
npm run test         # Run all tests once (Vitest)
npm run test:watch   # Run tests in watch mode
npx tsc --noEmit     # Type-check without emitting — run this after significant changes
```

**Run a single test file:**
```bash
npx vitest run client/src/lib/insight/__tests__/preOutcomeInsight.test.ts
```

**Android (Capacitor):**
```bash
npm run build && npx cap sync android   # Sync web assets to Android project
# Then open android/ in Android Studio to build/run the APK
```

**Dev server config** is in `.claude/launch.json` — use `preview_start "Vite Dev Server"` to launch via the Claude preview tool.

## Architecture

### Stack
Pure client-side SPA — no backend, no server. React 19 + Vite + TypeScript. Deployed as an Android APK via Capacitor (`appId: com.stillmindlabs.clarity`, `webDir: client/dist`). Routing via **wouter** (not React Router).

### Source root
All app code lives under `client/src/`. The `@` alias resolves to `client/src/` throughout.

### Persistence — two separate stores
1. **IndexedDB** (`lib/db.ts`) — all `Decision` records. Accessed via the `db` singleton (getAllDecisions, getDecision, saveDecision, deleteDecision, getSetting, setSetting). DB name: `clarity-db`, version 1. Settings (theme, enablePause) also live here.
2. **localStorage** — three distinct keys:
   - `clarity_learning_v1` — aggregate calibration/archetype stats written by `updateLearningData()` in `lib/learningStore.ts` every time an outcome is recorded
   - `clarity_user_stats` — raw prediction counts used by `lib/stats.ts`
   - `app_pin` — SHA-256 hex hash of the user's PIN (never the raw digits); use `lib/pinHash.ts` to hash before storing or comparing

### Decision lifecycle
```
FrameworkFlow (/framework-flow)  ─┐
DecisionFlow  (/flow)            ─┤─► Decision saved to IndexedDB
QuickFlow     (/quick-flow)      ─┘         │
                                     DecisionSummary (/decision/:id)
                                             │  [pending]
                                       OutcomeModal
                                             │  [recorded]
                                      updateLearningData()
```
`FrameworkFlow` is the primary entry point (chip-based, single page). `DecisionFlow` is the secondary step-by-step path, accessible from the home screen. Both write the same `Decision` shape.

### Insight engine — the core intelligence
The pipeline runs at **save time** in both flow pages, not on-demand:

```
chipReference.ts        → chip options per category (8 categories × 3 sections × 6 chips)
        │
resolver.ts             → resolveArchetype({ category, worry, pull, action, importance, probability })
        │                  Returns { primary: InsightArchetype | "low_signal", secondary }
        │                  normalizeCategory() maps display names → internal keys
        │                  getLearningData() adjusts scores based on past calibration
        │
messaging.ts            → getArchetypeInsight({ primary, secondary }, category, concern)
        │                  Returns { title, summary, coaching }
        │
Decision.preInsightArchetype   ← stored as structured { title, summary, coaching }
Decision.preInsight            ← stored as "title||summary||coaching" (legacy compat)
```

**8 archetypes** defined in `archetypes.ts`: `fear_based_avoidance`, `validation_seeking`, `scarcity_mindset`, `identity_conflict`, `ambition_tension`, `emotional_attachment`, `impulse_restlessness`, `clear_conviction`. A ninth pseudo-value `"low_signal"` is returned when inputs are too weak to classify — `getArchetypeInsight` handles it with a "Reflect" neutral response.

**Calibration loop**: when an outcome is recorded, `worstOutcomeOccurred` (derived from `outcomeResult` in `saveOutcome()`) and the original `worstOutcomeProbability` are compared. `updateLearningData()` writes to `clarity_learning_v1`, which `resolver.ts` reads on the next decision to weight archetype scores toward the user's known bias pattern.

**Post-outcome analytics** (`lib/insight/core.ts`): `getCalibrationBreakdown()` and `getDominantBias()` compute over/under/accurate counts from all closed decisions for the Dashboard and Journal insight panel.

### `ClarityInsightBlock` rendering priority
`decision-summary.tsx` renders the pre-outcome insight using this fallback chain:
1. `decision.preInsightArchetype` (structured object — new records)
2. `decision.preInsight.split("||")` parts (3-part string — legacy records saved before the structured field existed)
3. Empty state: "Log the outcome later to unlock your calibration insight."

### Category name mapping
Chips use friendly display names (`"Work & Career"`, `"Money"`, etc.). `resolver.ts` contains `normalizeCategory()` which maps these to the internal keys used in all scoring rule blocks (`"Career"`, `"Finances"`, etc.). When adding new categories or renaming existing ones, update both `chipReference.ts` and `normalizeCategory()`.

### App shell
`app.tsx` handles:
- First-launch detection → redirect to `/onboarding` (checks `hasSeenOnboarding` in localStorage + empty DB)
- 7-day inactivity → redirect to `/onboarding`
- PIN lock screen (`PinLock` component) with 2-minute idle timeout
- Route tree: `/onboarding` renders outside `<Layout>` (full-screen); all other routes render inside `<Layout>` (header + bottom nav)

Bottom nav: **Home · Journal · Insights · Settings**. Profile (`/profile`) is reachable from Settings → "How this works".

### Tests
Only test file currently: `client/src/lib/insight/__tests__/preOutcomeInsight.test.ts` — 19 tests covering archetype resolution quality (fear signal, validation-seeking, ambition tension, low-signal handling, output completeness, legacy string compat). Tests stub `localStorage` in `beforeAll` because `learningStore.ts` calls it at module scope via `resolver.ts`.

### Branch strategy
- `main` — stable/shipped; never commit directly
- `develop` — all work goes here, PRs open into `main`
