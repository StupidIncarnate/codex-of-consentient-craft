# Hydration Recipes Architectural Alignment Plan

## Objective
Re-architect `@dungeonmaster/hydration-recipes` to strictly conform to Dungeonmaster architectural patterns:
1. `startup/` -> `flows/` -> `responders/` -> `brokers/`.
2. Automatic/dynamic recipe pickup (no manual `if-else` branching or static lists).
3. Centralized `recipes-catalog-broker` registering all recipes with metadata and validation schemas.
4. Responders (`recipes-listing-responder`, `recipes-seed-responder`) and root `responders.ts` barrel.
5. Decouple test harnesses and E2E tests from internal brokers, routing through responders or startup.
6. ESLint rule in `@dungeonmaster/eslint-plugin` to enforce package structure and ban external imports of `@dungeonmaster/hydration-recipes/brokers`.

---

## Progress Overview

| Batch | Description | Status |
|-------|-------------|--------|
| **Batch 1** | Recipes Catalog, Directory Reorganization, and Dynamic Brokers | Completed ✅ |
| **Batch 2** | Responders, Flows, and Startup in `packages/hydration-recipes` | Completed ✅ |
| **Batch 3** | `@dungeonmaster/shared`, `siegelense`, and Test Harness Decoupling | Completed ✅ |
| **Batch 4** | ESLint Rule in `@dungeonmaster/eslint-plugin` | Completed ✅ |
| **Batch 5** | Verification, Build, and Whole-Branch Ward Verification | Completed ✅ |

---

## Batch Breakdown

### Batch 1: Recipes Catalog & Reorganization
- [x] **1.1 Planner**: Inspect existing recipes in `packages/hydration-recipes/src/brokers/` (`guild-mid-execution`, `quest-advances-one-step`, `session-with-nested-chain`, `guild-with-three-quests`, `session-with-nested-subagent`).
- [x] **1.2 Worker**:
  - Reorganize all recipes into `src/brokers/recipes/<recipe-name>/recipes-<recipe-name>-broker.ts`.
  - Create `src/brokers/recipes/catalog/recipes-catalog-broker.ts` (+ proxy, unit test).
  - Refactor `recipes-listing-build-broker.ts` to dynamically query catalog without hardcoding.
  - Refactor `recipes-seed-run-broker.ts` to dynamically look up recipes and validate params without `if-else`.
- [x] **1.3 Reviewer**: Audit diff, run scoped ward on Batch 1 files.

### Batch 2: Responders, Flows, and Startup
- [x] **2.1 Planner**: Validate responder and startup rules via `get-folder-detail({ folderType: 'responders' })` and `get-folder-detail({ folderType: 'startup' })`.
- [x] **2.2 Worker**:
  - Implement `src/responders/recipes/listing/recipes-listing-responder.ts` (+ proxy, test).
  - Implement `src/responders/recipes/seed/recipes-seed-responder.ts` (+ proxy, test).
  - Create `src/responders.ts` barrel.
  - Implement `src/flows/recipes/recipes-flow.ts` (+ integration test).
  - Implement `src/startup/start-hydration-recipes.ts` (+ integration test).
  - Update `packages/hydration-recipes/index.ts` to export startup, responders, contracts, and dynamic manifest.
- [ ] **2.3 Reviewer**: Audit diff, run scoped ward on Batch 2 files.

### Batch 3: Shared Statics, Siegelense, and Test Harness Decoupling
- [x] **3.1 Planner**: Inventory all external call sites to `@dungeonmaster/hydration-recipes/brokers`.
- [x] **3.2 Worker**:
  - Update `packages/shared/src/statics/recipes-convention/recipes-convention-statics.ts` to reference responders.
  - Update `packages/siegelense` (`recipes-read-broker.ts`, `recipe-seed-run-broker.ts`) to use responders.
  - Refactor `packages/server/test/harnesses/server-app/server-app.harness.ts` to use responders.
  - Refactor `packages/web/test/harnesses/guild/guild.harness.ts` and `quest.harness.ts` to use responders.
  - Refactor `packages/web/src/flows/home/guild-two-route-comparison.e2e.ts`.
- [ ] **3.3 Reviewer**: Audit diff, run scoped ward on Batch 3 files.

### Batch 4: ESLint Rule Enforcement
- [x] **4.1 Planner**: Inspect `@dungeonmaster/eslint-plugin` rules and configuration.
- [x] **4.2 Worker**:
  - Create `rule-enforce-hydration-recipes-structure-broker.ts` in `packages/eslint-plugin` (+ proxy, test).
  - Guard: only fire if `packages/hydration-recipes` exists in repo.
  - Ban: report any import matching `@dungeonmaster/hydration-recipes/brokers*`.
  - Enforce: verify existence of `startup/start-hydration-recipes.ts`, `flows/recipes/recipes-flow.ts`, and `responders.ts`.
  - Register rule in plugin config.
- [ ] **4.3 Reviewer**: Audit diff, run scoped ward on ESLint plugin files.

### Batch 5: Build and Verification
- [x] **5.1 Worker**: Build affected packages (`hydration-recipes`, `eslint-plugin`, `siegelense`, `server`, `web`).
- [x] **5.2 Reviewer**: Run `npm run ward -- --committed --uncommitted`.
- [x] **5.3 Reviewer**: Test `dungeonmaster siegelense recipes` CLI output.
