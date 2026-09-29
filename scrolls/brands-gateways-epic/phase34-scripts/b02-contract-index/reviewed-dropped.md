# Dropped from the 3.1 delete candidates

Each candidate below is in `delete-candidates.txt` (dead by import) but is reached by something the index cannot see.

- `packages/config/src/contracts/file-path/file-path-contract.ts`: Docs that teach it as an example: packages/mcp/src/statics/folder-constraints/adapters-constraints.md:110,336 and contracts-constraints.md:77 (`import {filePathContract} from './file-path-contract'`), packages/mcp/README.md:120.
- `packages/config/src/contracts/framework/framework-contract.ts`: config/index.ts:16 `import type { Framework } from ...framework-contract` and re-exports it in `export type { Framework, ... }` (public `@dungeonmaster/config` type). delete.cjs edits only `export ... from` lines, so it would leave a dangling import; needs a hand edit of index.ts.
- `packages/config/src/contracts/schema-library/schema-library-contract.ts`: config/index.ts:17 `import type { SchemaLibrary }` re-exported in `export type { ... }`; same dangling-import problem as framework.
- `packages/eslint-plugin/src/contracts/allowed-import/allowed-import-contract.ts`: String fixtures: rule-enforce-stub-patterns-broker.test.ts:57 (`import { allowedImportContract } from './allowed-import-contract'` inside test code) and is-entry-file-guard.test.ts:190-192 (`allowed-import-contract.ts` path fixtures).
- `packages/hydration-recipes/src/contracts/recipe-manifest/recipe-manifest-contract.ts`: String fixture: eslint-plugin rule-enforce-hydration-recipes-structure-broker.test.ts:51 (`import { recipeManifestContract } from '@dungeonmaster/hydration-recipes/contracts'`); the hydration-recipes barrel also exports it (index.ts:17 imports the hydration copy instead).
- `packages/orchestrator/src/contracts/slot-manager-result/slot-manager-result-contract.ts`: Public API asserted by name: orchestrator/src/index.ts:87-88 exports `slotManagerResultContract` and type, orchestrator/testing.ts:33 exports `SlotManagerResultStub`, and orchestrator/src/index.test.ts:50 lists `'slotManagerResultContract'` as an expected export.
- `packages/orchestrator/src/contracts/smoketest-placeholder/smoketest-placeholder-contract.ts`: String reference: orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts:45-62 names type `SmoketestPlaceholder` and the contract path as data; its test (:48) asserts the path.
- `packages/shared/src/contracts/quest-status-metadata/quest-status-metadata-contract.ts`: Path-string fixture: local-eslint is-status-comparison-allowlisted-guard.test.ts:78 lists the contract path. Test passes without the file (pure string guard); dropped under the fixture rule, safe to reinstate.
- `packages/shared/src/contracts/work-item-status-metadata/work-item-status-metadata-contract.ts`: Path-string fixture: local-eslint is-status-comparison-allowlisted-guard.test.ts:79 lists the contract path. Same as quest-status-metadata; safe to reinstate.

## Kept but flagged (in the list)

- `packages/mcp/src/contracts/folder-type`, `folder-dependency-tree`, `absolute-path`: packages/mcp/CLAUDE.md:131-148 names them as dedup follow-ups / a local brand (it also cites `adapters/fs/*`, which no longer exists). The doc goes stale after deletion; edit it in the same step.
- Comments only (no code): `direct-call-edge`, `recipe-result`, `decoded-frame`, `status-query`, `fail-count`, `content-type`, `error-code`, `delay-milliseconds` are named in JSDoc/comments of other contracts. Harmless.
- `hooks/src/contracts/child-process`: name collision with `#gateway/node/child_process/child-process` stubs only; separate file.
- `packages/@gateway/**` and `dist/` were scanned/ignored respectively; no gateway file imports any listed contract.
- Public barrels: Listed contracts that are `export *` lines in `packages/*/contracts.ts` (config routing-library, hydration op-description and seed-step, hydration-recipes recipe-result, shared bin-entry/css-font-family/direct-call-edge/step-chunk-size/tool-result-content-block-param, siegelense decoded-frame/http-request-reading/status-query). delete.cjs removes those lines; they leave the published `contracts` subpath of those packages.
