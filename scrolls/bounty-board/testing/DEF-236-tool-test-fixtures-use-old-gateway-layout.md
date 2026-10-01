# DEF-236: tool tests still use the old gateway layout as sample data

| | |
|---|---|
| Kind | defect |
| Status | ready |
| Priority | P3: sample data in tests uses an old layout |
| Package | testing |
| Found | 2026-09, `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history) item 42 |
| Moved from | `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), 2026-09-30 |

## What is wrong

Test fixtures feed resolvers and lint rules specifiers like `#gateway/npm/_test_` and package maps pointing at `./src/_test_/index.ts` and `./src/*/index.ts`. Each fixture is self-consistent, so the tests still prove their code, but a reader copying one gets a layout that no longer exists.

Checked 2026-09-30: `packages/testing/src/transformers/workspace-package-imports-target/workspace-package-imports-target-transformer.test.ts` still uses `'#gateway/npm/_test_'` mapped to `'@dungeonmaster/npm/_test_'` at lines 6-143. `workspace-package-export-source-transformer.test.ts` already uses the current `./src/*/*.proxy.ts` form. The `packages/eslint-plugin` rule tests were not re-checked.

## What should happen

Move the fixtures to the current forms: `#gateway/<pkg>/_test_/<subpath>` and `./src/*/*.ts`.

## Where to look

- `packages/testing/src/middleware/`, `packages/testing/src/transformers/`
- `packages/eslint-plugin` rule tests that mention `_test_`

## History

Original text: `scrolls/gateway/followup-sustainability.md` (deleted 2026-09-30; in git history), item 42.
