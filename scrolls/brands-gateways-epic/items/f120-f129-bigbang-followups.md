# F120 to F129: the big-bang follow-ups (F124 and F125 are planned elsewhere)

| | |
|---|---|
| Phase | Phase 4 follow-ups, after the big-bang run (EPIC.md "Follow-up units") |
| Source | EPIC.md "Follow-up units" rows F120, F121, F122, F123, F126, F127, F128, F129; "Concessions" rows 25, 27, 28; `bigbang/FIXER-BRIEF.md` decision 1 |
| Needs | nothing. Order inside this file: F126 batch 1 before F128 part B; F129 before anything that edits the rule |
| Unblocks | the final `build:clean`, `check:consumer`, `check:published` pass (F121, F122, F126 change published output) |
| Packages touched | `@dungeonmaster/server`, `@dungeonmaster/web`, `@dungeonmaster/orchestrator`, `@dungeonmaster/eslint-plugin`, `@dungeonmaster/testing`, `@dungeonmaster/shared`, `@dungeonmaster/hydration`, docs under `scrolls/` |
| Checks to run | per section; ward is always file-scoped (`npm run ward -- -- <files>`), never bare |
| Split | one agent per batch, 1 to 4 files each, batches in a section run in order unless a section says they are independent |
| Runs alone | no, except the two packages named under BUILD NEEDED |

Every count below was measured in the tree at HEAD 1bf2437aa on 2026-09-30. Scratch scripts: `tmp/f12x-plan/`.

## Decisions the operator must make (one line each; the sections argue them)

| # | Item | Decision | Recommendation |
|---|---|---|---|
| D1 | F129 | Which side wins: R8's owner-claimed parameter check, or concession 25 and FIXER-BRIEF decision 1 ("parameters stay plain")? | The rule wins. Reword the three texts. No code change. |
| D2 | F120 | Fix the ward-detail catch-all with an envelope (`{ detail }`, changes the wire body of one endpoint) or with a required `checks` key? | Envelope. |
| D3 | F121 | Keep accepting `filePathContract`, `absoluteFilePathContract`, `relativeFilePathContract` `.parse(...)` in `require-contract-validation`? | No. Two of the three no longer exist; accept a path literal only and name `dynamicImport`. |
| D4 | F123 | Delete `astNodeContract`, `ruleViolationContract` and `astToViolationTransformer`, which the plugin's public `index.ts` still exports? | Yes, remove all three and their three `index.ts` lines. |
| D5 | F126 | Give orchestrator a `./contracts` export key and barrel (the repo's documented shape), or re-export the one contract from `src/index.ts`? | The key and barrel. |
| D6 | F127 | Confirm the two R9 departures or reverse them? | Confirm both. Docs only. |
| D7 | F128 | Work the b14 leftovers list by hand now, or fold it into R3's `checkModuleLevelShapes` switch-on? | Fold it in. The list is stale. |

## F129: an owner-claimed parameter takes `Owner['field']` (the rule wins)

### Why

`enforce-owner-field-reuse` (R8) reports `({ questId }: { questId: string })` and fixes it to `Quest['id']`. Concession 25 says "Parameters, harness inputs and local accumulators stay plain" and FIXER-BRIEF decision 1 says "Inputs may be plain; returns are branded". The session snippet says "inputs MAY take a raw `string`". An agent reading the snippet writes a plain parameter and meets an error-level rule.

### Current state

The rule's parameter check: `packages/eslint-plugin/src/brokers/rule/enforce-owner-field-reuse/rule-enforce-owner-field-reuse-broker.ts:187` `'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': (` with the early exit at line 193 `if (isError) {`. It reports a `string` keyword or a plain type reference equal to the field's brand (`astOwnerTypeCandidateTransformer`), for an identifier or a property of an inline destructured type (`astParamTypedCarriersTransformer`), when `ownerIndexNameMatchTransformer` says an owner claims the name. It skips tests, proxies, stubs, harnesses and `errors/`.

Measured with `tmp/f12x-plan/params.py` and `names.py` (production files only, id-named annotations, so type-literal fields count beside parameters):

| Annotation | Count | Files |
|---|---|---|
| `Owner['field']`, for example `Quest['id']` 248, `Guild['id']` 69, `Session['id']` 61, `WorkItem['id']` 43 | 604 | 302 |
| plain `string` on an id-named identifier | 118 | 65 |

The 118 split by name: `processId` 40 and `chatProcessId` 42 (no owner claims those names: the owner index needs the owner words plus the key, `OrchestrationProcess` plus `processId`), `instanceId` 10, `toolUseId` 5 plus `childToolUseId` 3, `runId` 2, `caseId` 1, `unitId` 1, `userId` 1, `testId` 2, the rest plural or non-owner. The only plain `questId` and `guildId` left are in comments and in `errors/` (`packages/orchestrator/src/errors/quest-not-found/quest-not-found-error.ts:13` `public constructor({ questId }: { questId: string }) {`). So zero claimable plain parameters remain outside `errors/`; R8 scans 0 (handoff 07:40). The three responders that take `unknown` are not flagged and are correct, since they parse inside: `packages/orchestrator/src/responders/quest/get-summary/quest-get-summary-responder.ts:29` `questId: unknown;`, `get-projection/quest-get-projection-responder.ts:26`, `get-planning-notes/quest-get-planning-notes-responder.ts:24`.

Teaching text that says the opposite:
- `packages/shared/src/statics/session-snippet/session-snippet-statics.ts:104` "Returns must be branded Zod contracts — inputs MAY take a raw \`string\`. The asymmetry is deliberate"
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts:264` "\`ban-primitives\` is asymmetric on purpose: an input MAY take a raw \`string\`, a return MUST be branded." (`ban-primitives` was removed; the test at `architecture-overview-broker.test.ts:253-259` pins this sentence with a regex)
- `scrolls/brands-gateways-epic/bigbang/FIXER-BRIEF.md:20` "1. **Inputs may be plain; returns are branded.**", `bigbang/recipes/plain-into-brand.md:8`, `bigbang/recipes/ts2322-mismatch.md:68`
- The brands doc already agrees with the rule: `scrolls/brands-types-tests-rules.md` B4 "a field or parameter that holds another object's field uses that field's type" (line 554) and its flagged example at line 577.

### Recommended decision

The rule wins. Reasons: (1) the code is already there, 604 to 0; (2) one enforced rule is one place to keep in step, where the other side is a convention that drifts the first time an agent writes a plain parameter; (3) it works in a consumer, since the plugin ships the rule at error and the owner index reads the consumer's own `packages/*`, so a consumer agent needs the snippet to tell it the same thing; (4) the benefit B4 names ("a model can pass `'op-id-1'` and nothing stops it") only holds if the parameter is typed.

What concession 25 meant, restated: a parameter no owner claims stays plain (`processId`, `testId`), a harness input and a local accumulator stay plain, `errors/` stays plain (concession 28), and a parameter that takes `unknown` and parses inside is fine. A parameter named for an owner's field takes `Owner['field']`.

The other way (drop the parameter check) would delete the branch, two transformers and their tests (six files), and leave 604 typed parameters as an unenforced habit. Not recommended.

### Plan

Batch 1 (docs, 4 files, one agent):
- `scrolls/brands-gateways-epic/EPIC.md`: concession 25 last sentence becomes the restated rule above; concession 28 gains "an owner-claimed parameter elsewhere takes `Owner['field']`"; F129 row closed; one Log line.
- `scrolls/brands-gateways-epic/bigbang/FIXER-BRIEF.md`: decision 1 gains "unless an owner claims the parameter's name (R8): then `Owner['field']`, and the caller parses".
- `scrolls/brands-gateways-epic/bigbang/recipes/plain-into-brand.md`: line 8 and the paragraph at line 119 say the same.
- `scrolls/brands-gateways-epic/bigbang/recipes/ts2322-mismatch.md`: line 68, same sentence.

Batch 2 (teaching text, 3 files, one agent; gate `lint,typecheck,unit`):
- `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`: line 104 becomes "Returns must be branded Zod contracts. A parameter named for another object's field (`questId`) takes `Quest['id']`; any other parameter may be a plain `string`". The snippet must stay under 2KB (its own test).
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts`: line 264 states the same, without `ban-primitives`.
- `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.test.ts`: lines 253-259 pin the new sentence.

Batch 3 (1 file): `scrolls/brands-types-tests-rules.md` rows at lines 2328 and 2330 of the teaching-text table ("Change to" column) carry the sentence from batch 2, so Phase 6 does not undo it.

Not edited: the rule, its test, `errors/` exemption. BUILD NEEDED: `@dungeonmaster/shared` (the snippet reaches agents through the hooks' compiled output), operator only.

### Done when

The three texts agree; `npm run ward -- --only lint,typecheck,unit -- <batch 2 files>` exits 0.

### Who runs each batch (planned 2026-09-30; the plans live in the Z02 and Z03 item files)

- Batch 1 (EPIC.md, FIXER-BRIEF.md and the two recipes): Z02 batch Z02-D in `items/z02-architecture-and-snippet-text.md`. Docs only; neither Z02 nor Z03 owns a code file in it.
- Batch 2: `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts` and its test belong to Z02-A (the overview rewrite touches `:264` anyway); `packages/shared/src/statics/session-snippet/session-snippet-statics.ts` belongs to Z02-B and waits for the master merge (master edits that file). The snippet wording in this section is 26 bytes too long for the 2048-byte cap once Z02's gateway line joins it; Z02-B carries the shortened line. The snippet test has no `modifyingCodeGuidance` pin today, so Z02-B adds one.
- Batch 3 (`scrolls/brands-types-tests-rules.md` rows 2328 and 2330): Z02-C.
- Z03 owns none of F129's files.

## F126: server response-data `processId` and `chatProcessId` reuse the owner's field

### Current state

`packages/orchestrator/src/contracts/orchestration-process/orchestration-process-contract.ts:21` `processId: z.string().min(1).brand<'OrchestrationProcessProcessId'>(),`. Orchestrator's `package.json` `exports` holds only `.`, `./package.json`, `./*.proxy`, `./*.stub` and `./brokers`; no contracts barrel exists (`packages/orchestrator/src/contracts/` holds only folders). Five server response-data contracts carry their own brand:
- `packages/server/src/contracts/quest-start-response-data/quest-start-response-data-contract.ts:13` `processId: z.string().brand<'QuestStartResponseDataProcessId'>(),`
- `quest-new-response-data-contract.ts:15`, `quest-chat-response-data-contract.ts:12`, `quest-clarify-response-data-contract.ts:12`, `quest-followup-response-data-contract.ts:12`: `chatProcessId: z.string().brand<'...ChatProcessId'>()`.

R8 cannot demand this reuse: the name match needs `orchestrationProcessProcessId`, so nothing flags it. Dozens of other contracts (server payloads, web wire contracts, `shared` `orchestrationStatusContract`) carry their own `processId` brands; web and shared cannot import orchestrator, so this row stays on the five server contracts. The agent confirms in `packages/orchestrator/src/responders/chat/start/chat-start-responder.ts` that a chat process id is the id `orchestrationProcessContract` registers before editing the four `chatProcessId` files.

### Recommended decision (D5)

Add the documented barrel shape: `src/contracts/contracts.ts` with the one line `export * from './orchestration-process/orchestration-process-contract';` and a `./contracts` key carrying `source`, `types`, `import`, `require` (packages/CLAUDE.md, "What the package looks like"). Server contracts then write `processId: orchestrationProcessContract.shape.processId`. The field's `.min(1)` now applies to these five; the agent checks the five tests for an empty-string case.

### Plan

- Batch 1 (2 files): `packages/orchestrator/src/contracts/contracts.ts` (new), `packages/orchestrator/package.json` (the `./contracts` key).
- Batch 2 (4 files): `packages/server/src/contracts/quest-start-response-data/quest-start-response-data-contract.ts`, its `.test.ts`, `packages/server/src/contracts/quest-new-response-data/quest-new-response-data-contract.ts`, its `.test.ts`.
- Batch 3 (4 files): the contract and test of `quest-chat-response-data` and of `quest-clarify-response-data`.
- Batch 4 (2 files): the contract and test of `quest-followup-response-data`.

Checks: `lint,typecheck,unit` per batch. BUILD NEEDED: `@dungeonmaster/orchestrator` before `npm run prod`, then `check:published` (a new export key).

## F128: the big-bang leftovers files

Measured with `tmp/f12x-plan/leftovers.py`, `unknown.py`, `kept.py`.

### Part A: `b14-shape-contracts/out/leftovers.txt` (96 rows in the latest run, not 88)

Quote: `tmp/phase34/b14-shape-contracts/out/leftovers.txt:1` "Leftovers for hand (96), grouped by reason." 91 of the 96 shapes are still written inline in their files today (`tmp/f12x-plan/b14-still.json`); five were rewritten by fixer rounds. The rule that would flag them is `ban-adhoc-types` with `checkModuleLevelShapes`, registered off (`config-dungeonmaster-broker.ts:210` "B9 half as its `checkModuleLevelShapes` option, also off"); R3's scan was 213 and the handoff lists the switch-on as open. By reason:

| Reason | Rows | Verdict |
|---|---|---|
| `gate:` (a typecheck error seen while the script ran) | 23 | Obsolete: typecheck has been 0 since 2026-09-30 02:10. The shape stays inline. |
| `mixed-data-and-functions` | 19 | Obsolete as a hand queue. Concession 25(c) says a function-holding object is parsed for its data only; `isModuleLevelShapeGuard` (`packages/eslint-plugin/src/guards/is-module-level-shape/is-module-level-shape-guard.ts:21`) exempts only a pure method set. Decide the rule's answer first (below). |
| `type-ref:*` and `kind:*` (`TSESLint.RuleModule`, `ts.Node`, `ReturnType<typeof x>`, `typeof httpStatusStatics...`) | 27 | Obsolete as a hand queue: outside and derived types cannot become a zod contract. The rule should skip an object type whose member is one. |
| `one-fact-boolean` and `always-true-single-fact` | 14 + 2 | Real but not F128: `{ paused: boolean }` becoming a bare `boolean` changes the orchestrator-to-server-to-web wire body (`OrchestrationPauseResponder` and its 18-file ripple, see `callers.py`). Belongs to the R3 switch-on item, decided per site. |
| `unknown/any` | 5 | Obsolete: `SafeJsonParseResult` and `SafeXmlParseResult` `{ ok: true; value: unknown }` are deliberate; the three smoketest and package-facts sites hold `unknown[]`. |
| `object-union-without-discriminant` | 1 | One hand site: `packages/orchestrator/src/responders/quest/get-quest-work/quest-get-quest-work-responder.ts:36`. |

Recommendation (D7): do not hand-work this list. Switch on `checkModuleLevelShapes`, rescan (the rule's scan is the authority, the 01:04 list is stale), and decide three exemptions in the guard: a type holding a function member, a type holding an outside or derived type reference, a type holding `unknown`. That removes about 51 of the 91.

Plan (rule side only; the hand sites stay with the R3 switch-on item):
- Batch A1 (4 files): `packages/eslint-plugin/src/guards/is-module-level-shape/is-module-level-shape-guard.ts`, its `.test.ts`, `packages/eslint-plugin/src/guards/has-data-object-literal-type/has-data-object-literal-type-guard.ts`, its `.test.ts`. Gate `lint,typecheck,unit`.
- Batch A2 (1 file): the one union site above.

### Part B: `b15-unknown-fields/out/leftovers.json` (39 rows, not 14)

Today `z.unknown()`, `z.any()` and `z.custom<unknown>()` appear in production code twice: `packages/hydration/src/transformers/saved-ref-resolve/saved-ref-resolve-transformer.ts:28` `const fields = z.record(z.string(), z.unknown()).safeParse(record);` and `packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts:25` `const resolvedRecordContract = z.custom<unknown>();` (F116). Of the 39 rows, 16 name files that no longer exist and the other 23 name fields that now read `z.json()`, `z.record(z.string(), z.json())` or an owner reuse, as their `decision` column says (the responder-data row is done, 15512dd7f). Obsolete, except:
- Batch B1 (4 files, folds in F116): `packages/hydration/src/contracts/hydration-run-state/hydration-run-state-contract.ts` and `.test.ts`, `packages/hydration/src/transformers/saved-ref-resolve/saved-ref-resolve-transformer.ts` and `.test.ts`. Decide `z.json()` or the recipe record contracts.
- Optional, only if the operator wants typed questions: `packages/server/src/contracts/quest-clarify-body/quest-clarify-body-contract.ts:` `questions: z.array(z.json()),` and `answers: z.array(z.json()).min(1),`. It needs F126 batch 1's orchestrator export for `clarificationQuestionContract`; batch B2 (2 files): that contract and its test.

The "3 gateway schemas" rows belong to F124 step H7.

### Part C: `tmp/bigbang/logs/w9-kept.tsv` (78 sites in 65 files)

All 78 still parse with the named contract. Reasons: `unknown-provenance` 48 (the checker could not resolve the call: orchestrator returns into server responders, `new Map` results), `transform-contract` 22 (the parse applies a transform, so it is not dead), `composed-object-literal` 4, `gate-diagnostic` 2, `literal` 1, `cross-origin` 1. Verdict: kept by design, closed as a work unit. Optional one script run (rule S) after the next `build:clean`: re-run `phase34-scripts/b15-dead-reparse` so the 48 `call-unresolved` sites resolve against built types; review what it removes. No file list until it runs.

## F120: ward detail must not be the catch-all member of `responderResultContract`

### Current state

`packages/server/src/contracts/responder-result/responder-result-contract.ts:99` `wardDetailContract,` is the last union member. `wardDetailContract` is `z.object({ checks: z.array(checkResult).optional() }).loose().brand<'WardDetail'>()` (`packages/shared/src/contracts/ward-detail/ward-detail-contract.ts:84-89`): every field optional and loose, so `{}` and any object that fails every earlier `.strict()` member parses as ward detail. The only producer is `packages/server/src/responders/quest/ward-detail/quest-ward-detail-responder.ts:49` `data: wardDetailContract.parse(detail),`; the only HTTP reader is `packages/web/src/brokers/quest/ward-detail/quest-ward-detail-broker.ts:30` `return wardDetailContract.parse(response);`. The WebSocket ward-detail frame is a separate path (`detail: unknown`) and is untouched.

### Recommended decision (D2)

An envelope: `questWardDetailResponseDataContract = z.strictObject({ detail: wardDetailContract }).brand<'QuestWardDetailResponseData'>()`, like the other `*-response-data` members. Ward detail leaves the union. The web broker returns `parsed.detail`, so `WardDetail` and every caller (`ward-result-detail-layer-widget`, `ward-result-row-layer-widget`) keep their types. Cost: the body of `GET /api/quests/:questId/ward-results/:wardResultId` changes; both ends are in this repo. The cheaper option (make `checks` required in a server-only member) still accepts any object carrying a `checks` key and fixes half the problem.

### Plan

- Batch 1 (3 files, new): `packages/server/src/contracts/quest-ward-detail-response-data/quest-ward-detail-response-data-contract.ts`, `quest-ward-detail-response-data-contract.test.ts`, `quest-ward-detail-response-data.stub.ts`.
- Batch 2 (4 files): `packages/server/src/contracts/responder-result/responder-result-contract.ts` (import, member, drop `wardDetailContract` and its line 55 comment), `responder-result-contract.test.ts` (a case that `{}` no longer parses as data), `packages/server/src/responders/quest/ward-detail/quest-ward-detail-responder.ts`, `quest-ward-detail-responder.test.ts`.
- Batch 3 (3 files): `packages/web/src/brokers/quest/ward-detail/quest-ward-detail-broker.ts`, `quest-ward-detail-broker.test.ts`, `quest-ward-detail-broker.proxy.ts` (stages the envelope).

Checks: `lint,typecheck,unit` per batch; `integration` on `packages/server/src/flows/quest/quest-flow.integration.test.ts`; e2e for `packages/web/src/flows/quest-chat/ward-crash-detail.e2e.ts` and `ward-discovery-mismatch-detail.e2e.ts` (operator, at a quiet point).

## F121: `require-contract-validation` names contracts that no longer exist

### Current state

`packages/eslint-plugin/src/brokers/rule/require-contract-validation/rule-require-contract-validation-broker.ts:25` `'require() must use path contract validation or file path literals. Valid: require("./file.ts") OR require(filePathContract.parse(path)). Import contract: import { filePathContract } from "@dungeonmaster/shared/contracts"',` and lines 96-98 and 148-150 accept `filePathContract`, `absoluteFilePathContract`, `relativeFilePathContract`. `filePathContract` and `absoluteFilePathContract` are gone (`tmp/deletions/W5/packages/shared/src/contracts/file-path/file-path-contract.ts`); only `relativeFilePathContract` still exists in shared. B0003's rewrite (commit 6385429b2) replaced `filePathContract.safeParse(literal)` with `startsWith('/') || startsWith('./') || startsWith('../')` at lines 68 and 118. The old contract was the union of absolute (`min(1)`, leading `/` or a Windows `^[A-Za-z]:\\`) and relative (`./`, `../`), so the rewrite dropped the Windows form; no source file uses one. No production file calls raw `require(` or `import(` of a variable (raw-import-ban, `dynamicImport` in `packages/@gateway/node/src/module/dynamic-import/dynamic-import.ts:16` `export const dynamicImport = async ({ path }: { path: string }): Promise<unknown> => import(path);`), so the rule's only live effect outside a gateway is its message. Line 39-41's exemption for `/adapters/runtime/dynamic-import/` names a folder type that is gone. The rule's test and this file are its only users of the message ids.

### Recommended decision (D3)

Keep the literal-path allowance (restore `^[A-Za-z]:\\` so it equals the old check). Drop the three contract names from both accept lists. The messages name `import { dynamicImport } from '#gateway/node/module'` and say to parse the returned namespace with a contract; a consumer has that gateway copy. Keep the three message ids, so no config or hook test moves.

### Plan

- Batch 1 (2 files): `packages/eslint-plugin/src/brokers/rule/require-contract-validation/rule-require-contract-validation-broker.ts` (messages, both accept lists, the stale adapters exemption, header USAGE line 6), `rule-require-contract-validation-broker.test.ts` (the `filePathContract`, `absoluteFilePathContract`, `relativeFilePathContract` valid cases at lines 8-42 become invalid cases; add a `C:\x` literal).

Checks: `lint,typecheck,unit`.

Left standing, found here: about 150 files carry a JSDoc USAGE line naming `filePathContract` or `absoluteFilePathContract` (for example `packages/shared/src/brokers/architecture/source-read/architecture-source-read-broker.ts:7`, `packages/eslint-plugin/src/transformers/gateway-barrel-path/gateway-barrel-path-transformer.ts:14`). One scripted comment sweep, separate follow-up; also `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:752` names the removed `ban-primitives`.

## F122: `testing` imports `@dungeonmaster/shared` without declaring it

### Current state

`packages/testing/package.json` `dependencies`: `@dungeonmaster/bin`, `@dungeonmaster/node`, `@dungeonmaster/npm`, `tsx`, `undici`; no `@dungeonmaster/shared`. Production files import it: `packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.ts:35` `import { execResultContract } from '@dungeonmaster/shared/contracts';`, `install-testbed-create-broker.ts:32`, `middleware/import-path-resolver/import-path-resolver-middleware.ts:19`, `transformers/quest-flow-observable-seed/quest-flow-observable-seed-transformer.ts:12-13`, `contracts/test-guild/test-guild-contract.ts:12`. This is older than R9's `execResultContract` move: `locationsStatics` was already imported. The reverse edge exists as a dev dependency (`packages/shared/package.json` `devDependencies` holds `@dungeonmaster/testing`).

### Recommended decision

Declare it: `"@dungeonmaster/shared": "*"` in `dependencies`; moving five contracts would only recreate the edge elsewhere. No build-order cycle: `scripts/build-workspaces.mjs:305-308` reads `dependencies` and `peerDependencies` only, and shared (devDependency on testing) sorts first. The b11 item's "testing gets no edge to shared" (`items/b11-unique-contract-names.md`) was wrong.

### Plan

- Batch 1 (1 file): `packages/testing/package.json`.
- Operator, not an agent (`npm install` is forbidden to agents): `npm install --package-lock-only` at a quiet point, which also rewrites the `packages/testing` entry in `package-lock.json` (fold in F63's jest bump run), then `npm run build:clean` and `npm run check:consumer`.

## F123: `astNodeContract` exists only for code nothing calls

### Current state

`packages/eslint-plugin/src/contracts/ast-node/ast-node-contract.ts:36` `parent: z.json().optional(),`: a real ESLint node's cyclic `parent` would not parse. Users, measured by name across `packages/**`: `rule-violation-contract.ts:22` `node: astNodeContract,` (and its stub), `ast-to-violation-transformer.ts:22` `node: AstNode;`, three lines of `packages/eslint-plugin/src/index.ts` (12 `export type { AstNode }`, 13 `export type { RuleViolation }`, 31 `export { astToViolationTransformer }`). No rule broker calls `astToViolationTransformer` or parses `ruleViolationContract`, and nothing imports them from `@dungeonmaster/eslint-plugin` in this repo. `packages/eslint-plugin/CLAUDE.md` already says "no contract holds an AST node".

### Recommended decision (D4)

Delete the three as one cluster. Published surface: the two types and the transformer leave the plugin's entry; the operator confirms no external consumer, since the repo has none. A `TSESTree.Node` is the type a rule uses.

### Plan

All moves are `mv` to `tmp/deletions/F123/<path>`, after a fresh `discover` proves no importer.
- Batch 1 (4 files): `packages/eslint-plugin/src/contracts/ast-node/ast-node-contract.ts`, `ast-node-contract.test.ts`, `ast-node.stub.ts`, and edit `packages/eslint-plugin/src/index.ts` (lines 12, 13, 31 and the header's word "contracts" stays).
- Batch 2 (3 files): `packages/eslint-plugin/src/contracts/rule-violation/rule-violation-contract.ts`, `rule-violation-contract.test.ts`, `rule-violation.stub.ts`.
- Batch 3 (2 files): `packages/eslint-plugin/src/transformers/ast-to-violation/ast-to-violation-transformer.ts`, `ast-to-violation-transformer.test.ts`.
- Batch 4 (1 file): `packages/eslint-plugin/src/statics/eslint-rule/eslint-rule-statics.ts` (the teaching example at line 735, `node: z.custom<AstNode>().optional()`).

Order: batch 3, batch 2, batch 1, batch 4 (importers first). Checks `lint,typecheck,unit` on the package's touched files plus `packages/eslint-plugin/src/startup/start-eslint-plugin.integration.test.ts`. BUILD NEEDED: `@dungeonmaster/eslint-plugin` (published entry).

## F127: the two R9 departures from B11's keeper table

### Current state

`packages/testing/src/contracts/test-guild-package-json/test-guild-package-json-contract.ts:13-15` `name`, `version` required and `scripts` required. The B11 table (`items/b11-unique-contract-names.md`, `packageJsonContract` row) said testing's copy is "type-only (never parsed)" and to delete it. It is parsed: `integration-environment-create-broker.ts:126` and `:169` `return testGuildPackageJsonContract.parse(JSON.parse(content));`, and shared's `packageJsonContract` has every field optional, so it cannot keep the required-field checks. Web holds `commentBatchReplyContract` (`packages/web/src/contracts/comment-batch-reply/comment-batch-reply-contract.ts:17`, the all-optional envelope) and server keeps `commentBatchResponseContract` (`packages/server/src/contracts/comment-batch-response/comment-batch-response-contract.ts:14`, the required-fields 200 body); B11 renamed the server's and kept web's. Both names are unique repo-wide today.

### Recommended decision (D6)

Confirm both. `testGuildPackageJsonContract` keeps real checks. "Reply" names the wire envelope and "Response" the 200 body, and reversing costs two folder renames and every importer for no behaviour change. The F122 finding weakens the old "no edge to shared" reason but not the required-field one.

### Plan

- Batch 1 (2 files, docs): `scrolls/brands-gateways-epic/items/b11-unique-contract-names.md` (rows at lines 265 and 274 say what landed), `scrolls/brands-gateways-epic/EPIC.md` (F127 row closed; a concession row).

Left standing, found here: `packageJsonRawContract` is defined twice with the same name and body, `packages/cli/src/contracts/package-json-raw/package-json-raw-contract.ts:13` and `packages/ward/src/contracts/package-json-raw/package-json-raw-contract.ts:13` `export const packageJsonRawContract = z.record(z.string(), z.json());`; R9's scan only reads object contracts. F124's H5 names the lift.

## Traps

- No ward is run by this plan. Every batch runs its own file-scoped `npm run ward -- --only lint,typecheck,unit -- <files>`; say in the commit which checks ran.
- F126 and F128 part B2 share the orchestrator `./contracts` key; do F126 batch 1 once.
- F120 changes a wire body: run the two e2e specs named above before calling it done.
- Files removed in F123 move to `tmp/deletions/F123/` with plain `mv`; nothing is deleted.

## Concessions made while executing

Empty at the start.
