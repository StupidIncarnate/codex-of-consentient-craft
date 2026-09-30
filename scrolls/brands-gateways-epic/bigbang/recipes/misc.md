# Misc-code recipe (diag-r2, every code except 2307/2305/2724/2322/2345/2352)

284 diagnostics. Source: tmp/bigbang/logs/diag-r2.json filtered into tmp/bigbang/logs/misc-r2.json; grouped in tmp/bigbang/logs/misc-groups.json (key = G-number below). Nothing was compiled; causes come from reading the code and the git history (`git show <commit>^:...` for the pre-script text). Paths below are relative to repo root.

## ROOT FILES FIRST

Files whose one change clears errors in other files (counts are diag-r2 errors in this cluster; the 2305/2345 cluster may drop further):

| Root file | Change | Clears |
|---|---|---|
| packages/hydration/src/contracts/hydration-target/hydration-target-contract.ts | `HydrationTarget` is a CONSTRAINT (`TTarget extends HydrationTarget`); it must not carry a brand. Make it a plain structural type | 13 (12 x TS2344 + file-target harness 2353); likely also many 2345 |
| packages/shared/src/contracts/item-with-id/item-with-id-contract.ts | `ItemWithId` is a generic constraint (`<T extends ItemWithId>`); drop `.brand<'ItemWithId'>()` | 8 x TS18046 in quest-array-upsert test; plus 2345s at call sites |
| packages/mcp/src/flows/{quest,architecture,interaction}/*-flow.ts (3 files) | `toolRegistrationContract.parse({..., handler})` strips the handler at runtime and loses context typing | 33 x TS7031 |
| packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts | same pattern for `recipeCatalogEntryContract.parse({probeListing, execute})` | 18 x TS7031 |
| packages/shared/src/contracts/{flow-node,operation-plan,operation-plan-piece,quest-contract-entry,qa-checklist-item,ward-queue-response}/*-contract.ts + smoketest-run-id.stub.ts | dangling identifiers left by the W3/W4 owner-id script | 12 x TS2304 (and everything typed off those contracts goes `any`) |
| packages/ward/src/contracts/{check-result,file-timing,passing-test,project-result,ward-result}/*-contract.ts | delete the self-import; `.default()` before `.brand()` | 22 (15 x 2395/2440, 7 x 2769 in ward) |
| packages/orchestrator/src/state/pending-clarification/pending-clarification-state.ts | `setForProcess` param type | 8 x TS2353 in its test |
| packages/web/src/contracts/elk-position-map/elk-position-map.stub.ts, .../flow-edge-route-map/flow-edge-route-map.stub.ts | stub param takes a plain record | 7 (+1 usage-buckets test is the same class) |
| packages/shared/src/contracts/ask-user-question-response/ask-user-question-response-contract.ts | record key should reuse the question field's brand (B4) | 1 x TS7053 (hooks) |
| packages/ward/src/guards/{is-explicit-path-scope,is-file-scope-requested}/*-guard.ts | `keyof` a branded object includes the `$brand` symbol | 10 |

Not a single root, but one decision governs 45 errors: G4 (branded `z.record` keys). See that group; the operator must choose the read pattern (or relax B3 for bag records) before fixers touch those files.

Cascades that clear by themselves once the 2305 cluster (removed standalone-brand exports) is fixed, do NOT patch them locally: G9 (8) and G5b (3).

## Scripts that clearly produced wrong code (flags)

1. W3/W4 "owner id" rewriter (G2): replaced `xIdContract` with a bare identifier `xId` (and left `KEBAB_SEGMENT`, `ActiveSmoketestRun` undefined) instead of inlining or importing the owner's field. Commits 7226bd5d5, 77410aa20, b34da0d2a, e77105702, 2e1f83405, 2fe8d50aa, 631bc07d2.
2. W5 derived-field-brand script (G3): appended `import { xContract } from './x-contract'` INSIDE x-contract.ts itself in 5 ward contracts, and put `.brand()` before `.default(n)`.
3. W6 object-brand script (G5): wrapped object literals that hold FUNCTIONS in `contract.parse({...})`. zod object parse STRIPS unknown keys, so at runtime `handler` / `probeListing` / `execute` are dropped: this is a behaviour bug, not only a typing one.
4. W6 stub wrapper (G11): wrapped the argument of `setForProcess({processId, questId, questions})` in `PendingClarificationEntryStub(...)`, but the argument is `{processId} & entry`, not an entry.
5. `import type { OrchestrationProcessStub }` (orchestration-processes-state.proxy.ts:5) turned a value import into a type import while the stub is called at :46 (TS1361).
6. Brand-on-constraint (G6): W6 branded contracts whose type is only ever used as a generic constraint.
7. Syntax break, not in diag-r2 (log predates it or tsc stops elsewhere): packages/hydration/src/contracts/link-spec/link-spec-contract.ts line 22 lacks the trailing comma after `.brand<'LinkSpecOf'>()` before `as:`. Fix it while in G8 (LinkSpec). Worth a sweep of all files touched by the W6 multi-line rewriter for the same.


## G1 unused imports left by removed brands (65: TS6133 x55, TS6196 x9, TS6192 x1)

Cause: a standalone brand / contract was removed or a parse wrap was stripped (repair commit d2d9af3a0); its import stayed.
Names: `Identifier` x23 (eslint-plugin, local-eslint), `Guild` x16 / `Quest` x2 / `WorkItem` x2 / `WardResult` (web, mcp, orchestrator harnesses), and unused `*Contract` imports (fileMetadataContract x3, guildContract x2, flowNodeContract x2, treeItemContract, treeNodeContract, hydrationRunStateContract, questContractEntryContract, workItemContract, unitObservationFieldsContract, routedGraphContract, ownerIndexFieldContract, laneSpecContract, resultsQueryContract, mockCallContract, fileTimingContract, errorEntryContract).
Fix: delete the name from the import; delete the whole line when it was the only name (TS6192 = every name unused). Change nothing else. If the file has ANOTHER error that wants a parse by that same contract (e.g. mcp file-scanner-broker 91 wants `fileMetadataContract`), use the import there instead of deleting.
Before: `import type { Identifier } from '@dungeonmaster/shared/contracts';`  After: line gone.
Before: `import type { Guild, Quest } from ...` (only Quest used)  After: `import type { Quest } from ...`.
No single root file; mechanical.
- packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/rule-ban-proxy-empty-called-with-broker.ts: 22
- packages/eslint-plugin/src/brokers/rule/ban-proxy-empty-called-with/void-sink-spy-layer-broker.ts: 14
- packages/eslint-plugin/src/brokers/rule/ban-type-aliases/rule-ban-type-aliases-broker.ts: 19
- packages/eslint-plugin/src/brokers/rule/enforce-project-structure/collect-exports-layer-broker.ts: 12
- packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/rule-enforce-proxy-patterns-broker.ts: 11
- packages/eslint-plugin/src/brokers/rule/enforce-proxy-patterns/validate-no-exposed-child-proxies-layer-broker.ts: 8
- packages/eslint-plugin/src/brokers/rule/enforce-test-creation-of-proxy/rule-enforce-test-creation-of-proxy-broker.ts: 21
- packages/eslint-plugin/src/brokers/rule/gateway-colocation/barrel-named-reexports-layer-broker.ts: 15
- packages/eslint-plugin/src/brokers/rule/platform-globals-ban/enclosing-function-binding-names-layer-broker.ts: 13
- packages/eslint-plugin/src/brokers/rule/platform-globals-ban/rule-platform-globals-ban-broker.ts: 29
- packages/eslint-plugin/src/brokers/rule/require-object-contract-brands/rule-require-object-contract-brands-broker.ts: 17
- packages/eslint-plugin/src/transformers/ast-brand-path/ast-brand-path-transformer.ts: 12
- packages/eslint-plugin/src/transformers/ast-call-method-name/ast-call-method-name-transformer.ts: 9
- packages/eslint-plugin/src/transformers/ast-callee-root-name/ast-callee-root-name-transformer.ts: 12
- packages/eslint-plugin/src/transformers/ast-cast-target-root-name/ast-cast-target-root-name-transformer.ts: 11
- packages/eslint-plugin/src/transformers/ast-field-list-owners/ast-field-list-owners-transformer.ts: 11
- packages/eslint-plugin/src/transformers/ast-get-call-first-argument-name/ast-get-call-first-argument-name-transformer.ts: 8
- packages/eslint-plugin/src/transformers/ast-get-member-expression-root/ast-get-member-expression-root-transformer.ts: 10
- packages/eslint-plugin/src/transformers/ast-local-id-consts/ast-local-id-consts-transformer.ts: 12
- packages/eslint-plugin/src/transformers/ast-property-key-name/ast-property-key-name-transformer.ts: 10
- packages/eslint-plugin/src/transformers/type-name-from-annotation/type-name-from-annotation-transformer.ts: 10
- packages/hydration/src/brokers/plan/run/op-save-record-apply-layer-broker.ts: 12
- packages/local-eslint/src/brokers/rule/ban-quest-status-literals/is-status-member-expression-layer-broker.ts: 10
- packages/local-eslint/src/brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker.ts: 11
- packages/mcp/src/brokers/mcp/discover/mcp-discover-broker.ts: 25
- packages/mcp/src/transformers/file-base-path/file-base-path-transformer.ts: 9
- packages/mcp/src/transformers/format-tree-node/format-tree-node-transformer.ts: 18
- packages/mcp/src/transformers/path-to-basename/path-to-basename-transformer.ts: 9
- packages/mcp/src/transformers/path-to-relative/path-to-relative-transformer.ts: 9
- packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts: 10
- packages/orchestrator/src/brokers/guild/get/guild-get-broker.ts: 16
- packages/orchestrator/src/brokers/guild/list/guild-list-broker.ts: 10
- packages/orchestrator/src/brokers/quest/hydrate/build-hydrate-input-layer-broker.ts: 10
- packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts: 23
- packages/orchestrator/src/brokers/quest/work-record/quest-work-record-broker.ts: 19
- packages/orchestrator/src/transformers/quest-resolved-observable-packages/quest-resolved-observable-packages-transformer.ts: 12
- packages/orchestrator/src/transformers/quest-work-units/quest-work-units-transformer.ts: 33
- packages/orchestrator/test/harnesses/quest-seed/quest-seed.harness.ts: 11
- packages/shared/src/transformers/graph-reachability-violations/graph-reachability-violations-transformer.ts: 21
- packages/shared/src/transformers/owner-index-from-sources/owner-index-from-sources-transformer.ts: 24
- packages/siegelense/src/brokers/lane/boot/lane-boot-broker.ts: 59
- packages/siegelense/src/flows/siegelense/siegelense-results-layer-flow.ts: 20
- packages/testing/src/middleware/proxy-mock-collector/proxy-mock-collector-middleware.ts: 30
- packages/ward/src/brokers/command/run/multi-package-layer-broker.ts: 36
- packages/ward/src/transformers/result-to-detail/result-to-detail-transformer.ts: 17
- packages/web/test/harnesses/comment-box/comment-box.harness.ts: 17
- packages/web/test/harnesses/comment-queue-lifecycle/comment-queue-lifecycle.harness.ts: 19
- packages/web/test/harnesses/comment-queue-send/comment-queue-send.harness.ts: 21
- packages/web/test/harnesses/composer-paste/composer-paste.harness.ts: 24
- packages/web/test/harnesses/dispatch/dispatch.harness.ts: 24
- packages/web/test/harnesses/environment/environment.harness.ts: 16
- packages/web/test/harnesses/flow-diagram/flow-diagram.harness.ts: 14
- packages/web/test/harnesses/followup/followup.harness.ts: 20
- packages/web/test/harnesses/persisted-comments/persisted-comments.harness.ts: 16
- packages/web/test/harnesses/quest-approved-modal/quest-approved-modal.harness.ts: 9
- packages/web/test/harnesses/quest/quest.harness.ts: 9
- packages/web/test/harnesses/session/session.harness.ts: 9
- packages/web/test/harnesses/sticky-header/sticky-header.harness.ts: 17
- packages/web/test/harnesses/subagent-duration-triple-chain/subagent-duration-triple-chain.harness.ts: 34
- packages/web/test/harnesses/subagent-duration/subagent-duration.harness.ts: 32
- packages/web/test/harnesses/subagent-launch-order/subagent-launch-order.harness.ts: 16
- packages/web/test/harnesses/warpgate/warpgate.harness.ts: 16
- packages/web/test/harnesses/ws-quest-lifecycle/ws-quest-lifecycle.harness.ts: 12

## G2 dangling identifiers from the owner-id script (12 x TS2304)

Cause: W3/W4 removed `import { xIdContract }` and replaced the use with a bare `xId` that is never declared. Original definitions (from `git show <commit>^`):
- flowNodeId -> `z.string().min(1).regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u).brand<'FlowNodeId'>()`
- questContractEntryId -> same regex, `.brand<'QuestContractEntryId'>()`
- operationPlanId -> `z.uuid().brand<'OperationPlanId'>()`
- operationPlanPieceId -> `z.uuid().brand<'OperationPlanPieceId'>()`
- wardQueueResponseRunId -> `z.string().min(1).brand<'WardQueueResponseRunId'>()` (this is the WardRunId OWNER: ward-result-contract already reads `wardQueueResponseContract.shape.runId`, and ward-run-id.stub.ts too)
- qa-checklist-item: `KEBAB_SEGMENT` was a module const in the deleted id contract; add `const KEBAB_SEGMENT = '[a-z][a-z0-9]*(?:-[a-z0-9]+)*';` above the contract (line 38 already holds the inlined regex).
Fix: inline the schema at the field. Before / after (flow-node-contract.ts:31):
```
    id: flowNodeId,
    id: z.string().min(1).regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u).brand<'FlowNodeId'>(),
```
operation-plan-piece-contract.ts uses the id twice (line 23 `id:` and line 75 `dependsOn: z.array(operationPlanPieceId)`). A contract cannot read its own `.shape.id` inside its own initializer, so declare a file-local `const operationPlanPieceIdContract = z.uuid().brand<'OperationPlanPieceId'>();` above the contract and use it in both places (or brand dependsOn as its own key if lint objects).
smoketest-run-id.stub.ts (lines 2-3): the shared stub reads `ActiveSmoketestRun` / `activeSmoketestRunContract`, which live in packages/orchestrator, and shared cannot import orchestrator. The contract file was deleted, `contracts.ts` no longer exports it, and only orchestrator tests use `SmoketestRunIdStub` (state test, responder test, drain-listener test, active-smoketest-run-contract.test). Right fix: delete packages/shared/src/contracts/smoketest-run-id/ and have those four tests use `ActiveSmoketestRunStub({ runId }).runId` (or move a `SmoketestRunIdStub` into orchestrator next to active-smoketest-run.stub.ts). Operator decision because it spans files.
Root files (one per line): flow-node-contract.ts, operation-plan-contract.ts, operation-plan-piece-contract.ts, quest-contract-entry-contract.ts, qa-checklist-item-contract.ts, ward-queue-response-contract.ts (all in packages/shared/src/contracts/<name>/).
- packages/shared/src/contracts/flow-node/flow-node-contract.ts: 31
- packages/shared/src/contracts/operation-plan-piece/operation-plan-piece-contract.ts: 23,75
- packages/shared/src/contracts/operation-plan/operation-plan-contract.ts: 25
- packages/shared/src/contracts/qa-checklist-item/qa-checklist-item-contract.ts: 38
- packages/shared/src/contracts/quest-contract-entry/quest-contract-entry-contract.ts: 17
- packages/shared/src/contracts/smoketest-run-id/smoketest-run-id.stub.ts: 2,3
- packages/shared/src/contracts/ward-queue-response/ward-queue-response-contract.ts: 15

## G3 ward contracts: self-import and `.brand()` before `.default()` (26: TS2395 x10, TS2440 x5, TS2769 x11 incl. session-forensics and quest)

Cause A (15 x 2395/2440): each of check-result, file-timing, passing-test, project-result, ward-result contracts has `import { xContract } from './x-contract'` inside x-contract.ts itself (line 13/10/10/19/12). Fix: delete that import line.
Cause B (2769): `z.number().nonnegative().brand<'K'>().default(0)`. zod v4 checks the `.default()` literal against the OUTPUT type, and a bare `0` is not the branded type. The repo's own comment at file-timing-contract.ts:33 says it: `.default()` before `.brand()`. Before/after:
```
durationMs: z.number().nonnegative().brand<'CheckResultDurationMs'>().default(0),
durationMs: z.number().nonnegative().default(0).brand<'CheckResultDurationMs'>(),
```
Same swap for: ward file-timing (testMs, slowestTestMs, rulesMs), passing-test, project-result, ward-result durationMs; session-forensics work-item-index-row-contract.ts:31 (transcriptSizeBytes) and :32 (subagentCount).
quest-contract.ts:160 (2 diags): `z.object({...}).brand<'QuestPlanningNotes'>().default({ blightLedger: [], questNotes: [], operationPlans: [] })` has the same order problem for an object default. Fix: put `.default({...})` before `.brand<'QuestPlanningNotes'>()`; the empty-array literal satisfies the unbranded object output.
Root files: the five ward contract files (each fully self-contained), work-item-index-row-contract.ts, quest-contract.ts.
- packages/session-forensics/src/contracts/work-item-index-row/work-item-index-row-contract.ts: 31,32
- packages/shared/src/contracts/quest/quest-contract.ts: 160
- packages/ward/src/contracts/check-result/check-result-contract.ts: 13,15,19
- packages/ward/src/contracts/file-timing/file-timing-contract.ts: 10,12,23,31,42
- packages/ward/src/contracts/passing-test/passing-test-contract.ts: 10,12,15
- packages/ward/src/contracts/project-result/project-result-contract.ts: 19,21,54
- packages/ward/src/contracts/ward-result/ward-result-contract.ts: 12,14,19

## G4 branded `z.record` keys break every read (45 : TS7053 x~33, TS2339 x10, TS2353, TS18046)

Cause: rule B3 brands a record key (`z.record(z.string().brand<'XKey'>(), v)`), producing `Record<string & $brand<'XKey'>, V>`. A plain `string` or a string literal cannot index it (7053), a dotted read of a literal key fails (2339), an object literal with literal keys cannot be assigned to it (2353), and `Object.entries/fromEntries` over it loses the value type (18046 `cursor` unknown in usage-ledger-write-broker.ts:44).
71 record keys in the repo are branded this way. Two shapes:
1. BAG records (value `z.unknown()` or JSON, keys are external): TranscriptContentItemInputKey (hooks transcript-line), AgyPreToolHookDataToolCallArgsKey, TranscriptRecordMessageUsageKey, WorkItemPayloadKey (shared work-item), MintedWorkItemPayloadKey, ResultRowKey, PartialEslintConfigRulesKey, SpawnOptionsSnapshotEnvKey, PackageJsonScriptsKey (testing and ward), GatewayConsumerPackageJson(Dev)DependenciesKey.
2. Typed maps: RoutedGraphNodesKey, UsageLedgerBucketsKey, ElkPositionMapKey, FlowEdgeRouteMapKey.
No cast is allowed, and no standalone key contract exists, so there is no clean way to build a key from a literal. OPERATOR DECISION NEEDED before fixers start; options:
 (a) keep B3 and read with a plain-string comparison over the entries (works for both shapes, key from `Object.entries` is `string`):
```
const rawCommandLine = args?.CommandLine;
const rawCommandLine = Object.entries(args ?? {}).find(([key]) => key === 'CommandLine')?.[1];
```
     The value type may come back `any`/`unknown`; narrow with `typeof` as the code already does. Writes/literals go through the owner's parse (`elkPositionMapContract.parse({...})`), never a literal typed as the record.
 (b) add one shared transformer (e.g. `recordValueReadTransformer({ record, key })`) and have every site call it; smallest per-site diff and one place to get the typing right.
 (c) amend B3 so a bag record whose values are `z.unknown()`/JSON is exempt from key branding. That deletes the whole first shape (21 order of errors) in a handful of contract edits.
Special case (B4 instead): hooks ask-question-to-design-decisions-transformer.ts:36, `answers[item.question]`: the answers record key is `z.string().min(1).brand<'QuestionText'>()` (a local const in shared ask-user-question-response-contract.ts) while the value read is `AskUserQuestionItemQuestion`. The key IS the question field, so per B4 reuse it:
```
answers: z.record(questionTextKeyContract, answerValueContract),
answers: z.record(askUserQuestionContract.shape.questions.element.shape.question, answerValueContract),
```
(delete the now-unused `questionTextKeyContract`). Root: packages/shared/src/contracts/ask-user-question-response/ask-user-question-response-contract.ts.
Also for typed maps consumed by many sites, a B4-style fix at the contract can clear several at once: `elkPositionMapContract` / `flowEdgeRouteMapContract` keys are node/edge ids, so key them by the owner's id (`z.record(flowNodeContract.shape.id, ...)`, `flowEdgeContract.shape.id`), and RoutedGraph nodes by the flow node id. Then `positions[n.id]` in react-flow-diagram-widget.tsx (lines 285,318,378,412,416) and `graph.nodes[...]` reads type-check with no consumer change (the widget's `String(n.id)` calls become `n.id`).
Per-site files (line numbers):
- packages/eslint-plugin/src/brokers/rule/gateway-dependency-declared/validate-gateway-specifier-layer-broker.ts: 81,87
- packages/hooks/src/brokers/folder-detail/was-called/folder-detail-was-called-broker.ts: 71
- packages/hooks/src/responders/hook/agy-pre-tool/hook-agy-pre-tool-responder.ts: 47,89,90,122,123,124
- packages/hooks/src/transformers/ask-question-to-design-decisions/ask-question-to-design-decisions-transformer.ts: 36
- packages/hooks/src/transformers/eslint-config-filter/eslint-config-filter-transformer.ts: 44
- packages/hooks/src/transformers/transcript-tool-invocations-extract/transcript-tool-invocations-extract-transformer.ts: 46
- packages/orchestrator/src/brokers/agent/spawn-stream-json/agent-spawn-stream-json-broker.proxy.ts: 148
- packages/orchestrator/src/brokers/lane/provision-batch/lane-provision-batch-broker.ts: 105
- packages/orchestrator/src/brokers/quest/get-quest-work/quest-get-quest-work-broker.ts: 208
- packages/orchestrator/src/brokers/quest/work-record/quest-work-record-broker.ts: 110
- packages/orchestrator/src/brokers/usage-ledger/scan/fold-batch-layer-broker.ts: 55
- packages/orchestrator/src/brokers/usage-ledger/write/usage-ledger-write-broker.ts: 44
- packages/orchestrator/src/transformers/agent-flow-family-resolve/agent-flow-family-resolve-transformer.test.ts: 38
- packages/orchestrator/src/transformers/agent-flow-planned-steps-walk/agent-flow-planned-steps-walk-transformer.ts: 40
- packages/orchestrator/src/transformers/piece-brief-payload/piece-brief-payload-transformer.ts: 64
- packages/orchestrator/src/transformers/quest-projection-build/quest-projection-build-transformer.ts: 74
- packages/orchestrator/src/transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts: 231
- packages/session-forensics/src/transformers/record-to-token-usage/record-to-token-usage-transformer.ts: 30,37,38,40,42
- packages/session-forensics/src/transformers/tool-use-to-brief/tool-use-to-brief-transformer.ts: 33,35
- packages/siegelense/src/brokers/results/read/buffer-read-layer-broker.ts: 105,106
- packages/siegelense/src/transformers/result-row-project/result-row-project-transformer.ts: 36
- packages/testing/src/brokers/integration-environment/create/integration-environment-create-broker.ts: 129
- packages/web/src/widgets/execution-panel/execution-panel-widget.tsx: 364
- packages/web/src/widgets/react-flow-diagram/react-flow-diagram-widget.tsx: 285,318,378,412,416
Sub-notes: agy-pre-tool responder (2339 x6) reads `args?.CommandLine/TargetFile/CodeContent/...` off a bag record; siegelense buffer-read-layer-broker.ts:105-106 reads `source.url/method` off `ResultRow` (union of two records); web execution-panel-widget.tsx:364 reads `payload?.['pieceName']`; work-item payload reads `payload?.['instance']` occur in lane-provision-batch, quest-get-quest-work, quest-work-record, work-item-to-prompt-transformer.ts:231. piece-brief-payload-transformer.ts:64 writes `['pieceName']: piece.pieceName` into a return typed `MintedWorkItem['payload']`: build the return through `mintedWorkItemContract.shape.payload.parse({...carried, pieceName: ...})` (parse is the only legal entry to the branded key type).

## G5 function-holding contracts wrapped in `.parse()` (51 x TS7031) - RUNTIME BUG TOO

Contracts involved and what each really is:
- `toolRegistrationContract` (packages/mcp/src/contracts/tool-registration/tool-registration-contract.ts): data fields only (name, description, inputSchema); `ToolRegistration = z.infer<...> & { handler: ToolHandler }`. The contract has no `handler`.
- `recipeCatalogEntryContract` (hydration-recipes recipe-catalog-entry-contract.ts): data (recipeName, description, inputs); `RecipeCatalogEntry = Data & { probeListing, execute }`.
Cause: W6 turned each object literal `{ name, description, inputSchema, handler: async ({ args }) => ... }` into `toolRegistrationContract.parse({ ..., handler })`. `parse` takes `unknown`, so the handler lost its contextual type (`args`, `meta` implicitly any), and zod strips the unknown key `handler` at runtime, so every registration would ship with NO handler. Same for `probeListing`/`execute` in the catalog.
Right fix: parse only the data fields, spread the result, add the functions after. These are function-carrying types, so they stay a TS intersection (already are); they are not object-brand targets for the functions. Before / after (quest-flow.ts:56-61):
```
toolRegistrationContract.parse({
  name: 'get-quest' as never,
  description: 'Retrieves a quest by its ID' as never,
  inputSchema: getQuestSchema as never,
  handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest' as never, args }),
}),
{
  ...toolRegistrationContract.parse({
    name: 'get-quest',
    description: 'Retrieves a quest by its ID',
    inputSchema: getQuestSchema,
  }),
  handler: async ({ args }) => QuestHandleResponder({ tool: 'get-quest', args }),
},
```
The contextual type comes from the function's `ToolRegistration[]` return type, so `args`/`meta` are typed again. `as never` on the data fields is unneeded inside `parse` (it takes unknown); the `tool: 'get-quest' as never` argument to the responder is pre-existing (bd5242af3), leave or fix per the responder's own parameter type. Catalog (recipes-catalog-broker.ts, 9 entries at lines 45,67,...): `{ ...recipeCatalogEntryContract.parse({ recipeName, description }), probeListing: () => ..., execute: async ({ params, target }) => ... }`. The one-off `sessionWithNestedSubagentMeta` at :38 already parses data-only, keep.
Files (one edit per file clears all its rows): mcp/src/flows/quest/quest-flow.ts (15), mcp/src/flows/architecture/architecture-flow.ts (12), mcp/src/flows/interaction/interaction-flow.ts (6), hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts (18).
Also check the other flows under packages/mcp/src/flows/* (lifecycle etc.) for the same shape: they compile only because the handler happened to type-check; if they were wrapped they hold the same runtime bug.
Other function-holding contracts named in the brief (MockHandle, EndpointMockLifecycle, MockProcessBehavior in packages/testing/src/contracts/*) produce no error in THIS cluster; they are already the correct shape (`z.object({}).loose().brand<..>()` & function intersection, function part is a TS type). Do not parse anything into them; construct the object literal directly, typed as the intersection, or build the data part through the contract and spread the functions. `DmTarget` (hydration-recipes dm-target-contract.ts) holds `request: HttpRequestFn` via `z.custom<HttpRequestFn>` which is the correct way (parse returns the same function reference); leave it.
- packages/hydration-recipes/src/brokers/recipes/catalog/recipes-catalog-broker.ts: 57,79,101,136,158,193,228,250,271
- packages/mcp/src/flows/architecture/architecture-flow.ts: 38,45,52,59,67,75
- packages/mcp/src/flows/interaction/interaction-flow.ts: 34,46,58
- packages/mcp/src/flows/quest/quest-flow.ts: 60,66,73,79,85,92,99,107,117,129,136,143,150,157

## G5b live-quest-target harness (3 x TS7031, hydration-recipes/test/harnesses/live-quest-target/live-quest-target.harness.ts:135)
`request: async ({ method, path: requestPath, body }) =>` is an argument of `DmTargetStub({...})`; its parameter type is `StubArgument<DmTarget>`, and `DmTarget` currently resolves with `[x: string]: any` and no `home/claudeHome` because `absoluteFilePathContract` is missing (2305 cluster). Cascade: re-check after the 2305 fixes; if it persists, type the callback parameter `HttpRequestFn` args explicitly (`({ method, path: requestPath, body }: Parameters<HttpRequestFn>[0])`).

## G6 constraint contracts that got a brand

G6a (13): `hydrationTargetContract ... .brand<'HydrationTarget'>()` in packages/hydration/src/contracts/hydration-target/hydration-target-contract.ts. `HydrationTarget` is used only as `TTarget extends HydrationTarget` (`HydrationFor<TTarget extends HydrationTarget>`, `createHydration<DmTarget>()`). A brand makes the constraint unsatisfiable by any repo target (`Property '[$brand]' is missing`, `{ DmTarget: true }` vs `{ HydrationTarget: true }`). Fix in that ONE file: stop deriving the constraint from the branded parse output, e.g.
```
export type HydrationTarget = z.infer<typeof hydrationTargetContract>;
export type HydrationTarget = { baseUrl?: Url | undefined };
```
(keep the contract for the runtime parse if something parses it; drop `.brand<'HydrationTarget'>()` if not). Note the file-target harness (hydration/test/harnesses/file-target/file-target.harness.ts:81) calls `HydrationTargetStub({ home: ... })` with a `home` key that the constraint has never had: its `FileTarget` type is a repo-local extension; the stub should take/return `FileTarget`, a fixer decision inside that harness (one error).
Also: the `DmTarget` printed as `{ [x: string]: any; baseUrl?; request? }` lacks home/claudeHome, i.e. absoluteFilePathContract resolves to `any` today; after G6a and the 2305 fixes recheck dm-registry-broker.ts:64 and recipes-hydration-create-broker.ts:31-32.
G6b (8): `itemWithIdContract = z.object({ id: z.unknown(), _delete }).loose().brand<'ItemWithId'>()` in packages/shared/src/contracts/item-with-id/item-with-id-contract.ts is used only as `<T extends ItemWithId>` in questArrayUpsertTransformer. No `Flow`/`FlowNode` can satisfy a branded constraint, so T falls back to `ItemWithId` and `result[0].nodes` is `unknown` (TS18046 x8 in quest-array-upsert-transformer.test.ts:86,105,106,108,131,268,269,293). Fix: remove `.brand<'ItemWithId'>()` (or make `ItemWithId` a plain `{ id: unknown; _delete?: boolean }` type). No test change.
Rule to state to fixers: a contract used only as a generic constraint or structural shape for other brands must not be branded. Suggest sweeping for `extends <X>` where X is a branded contract type.
- packages/hydration-recipes/src/brokers/dm/registry/dm-registry-broker.ts: 64
- packages/hydration-recipes/src/brokers/recipes-hydration/create/recipes-hydration-create-broker.ts: 31,32
- packages/hydration/src/brokers/hydration/create/hydration-create-broker.test.ts: 15,33,54,77,107,145,165,220
- packages/hydration/test/harnesses/file-target/file-target.harness.ts: 81
- packages/hydration/test/type-fixtures/positive/shape-assertions.ts: 102
- packages/orchestrator/src/transformers/quest-array-upsert/quest-array-upsert-transformer.test.ts: 86,105,106,108,131,268,269,293

## G7 `keyof <branded object>` includes the `$brand` symbol (10: TS1360 x4, TS7053 x6)
Files: ward is-explicit-path-scope-guard.ts and is-file-scope-requested-guard.ts. `PATH_ORIGIN_BY_FIELD ... satisfies Record<keyof WardConfig, WardPathOrigin>` and `Object.keys(...) as (keyof WardConfig)[]` now demand a `$brand` symbol key too (`unique symbol | "committed" | ...`). Fix: exclude symbols.
```
as const satisfies Record<keyof WardConfig, WardPathOrigin>;
const FIELDS = Object.keys(PATH_ORIGIN_BY_FIELD) as (keyof WardConfig)[];
as const satisfies Record<Exclude<keyof WardConfig, symbol>, WardPathOrigin>;
const FIELDS = Object.keys(PATH_ORIGIN_BY_FIELD) as Exclude<keyof WardConfig, symbol>[];
```
(the `as` there is the file's existing narrowing of `Object.keys`, not a brand cast; if lint objects, type FIELDS via `Array.from(...)`-free literal list). Check the same trap elsewhere: any `keyof` of a branded contract type (packages/ward, hooks statics). Files:
- packages/ward/src/guards/is-explicit-path-scope/is-explicit-path-scope-guard.ts: 36,40,41
- packages/ward/src/guards/is-file-scope-requested/is-file-scope-requested-guard.ts: 33,36

## G8 comparing two different brands (14 x TS2367)
Cause: two branded strings/numbers of different owners are compared with `===`; brands with different names have no overlap. Two sub-cases:
1. Same real domain, different owner: apply B4 and make the FIELD reuse the owner's field so both sides carry one brand:
   - siegelense results-read-broker.ts:253,280: `shot.step`/`reading.step` (ShotListingStep, StepReadingStep) vs `query.step` (ResultsQueryStep): the step index; owner is the step contract, `resultsQueryContract.step` and the two listing contracts should reuse `stepContract.shape.step`... decide the owner once.
   - siegelense step-seed-broker.ts:43 `candidate.recipeName` (RecipeListingEntryRecipeName) vs `step.recipe` (StepRecipe).
   - siegelense key-read-transformer.ts:361 `candidate.ref` (RawKeyReadingRowsRef) vs `row.parentRef` (RawKeyReadingRowsParentRef): a parent ref IS a row ref, key `parentRef` with `rows.element.shape.ref`.
   - hydration row-handle-chain-transformer.ts:85 `link.of` (LinkSpecOf) vs `ingredientConfig.name` (IngredientConfigName): `linkSpecContract.of` should be `ingredientConfigContract.shape.name`... link-spec is imported BY ingredient-config, which would be circular, so compare as plain strings instead (see 2).
   - web use-ward-detail-binding.ts:62 `p.wardResultId` (WardDetailResponseWardResultId) vs `wardResultId` (WardResultId): the response field should be `wardResultContract.shape.id`.
   - tooling gateway-match-find-transformer.ts:30,47,49,54 (6 diags): `GatewayExportImportPath/Name` vs `OutsideCallModule/Name` vs `GatewayImplementationImportPath/Name`: three contracts naming the same import path and export name.
   - testing workspace-package-import-resolve-middleware.ts:60 `packageJson.name` (WorkspacePackageJsonName) vs `specifierParts.packageName` (PackageSpecifierPartsPackage).
2. Cheap, local fix when the owner reuse is circular or wrong: compare the plain values, widening one side through a `string`/`number`-typed const (assigning a brand to plain is legal, no cast):
```
if (oldContent === newContent) {
const oldText: string = oldContent;
if (oldText === newContent) {
```
   Apply to hooks violations-check-new-broker.ts:100 (ContentChangeOldContent vs ContentChangeNewContent) and any site above where B4 is not obviously right. In tests and predicates like `.find((x) => x.a === y.b)` widen with `String(x.a) === String(y.b)` / `Number(...)`.
The operator should prefer 1 where the ids truly are the same value (fixes many downstream 2345s too).
- packages/hooks/src/brokers/violations/check-new/violations-check-new-broker.ts: 100
- packages/hydration/src/transformers/row-handle-chain/row-handle-chain-transformer.ts: 85
- packages/siegelense/src/brokers/results/read/results-read-broker.ts: 253,280
- packages/siegelense/src/brokers/step/seed/step-seed-broker.ts: 43
- packages/siegelense/src/transformers/key-read/key-read-transformer.ts: 361
- packages/testing/src/middleware/workspace-package-import-resolve/workspace-package-import-resolve-middleware.ts: 60
- packages/tooling/src/transformers/gateway-match-find/gateway-match-find-transformer.ts: 30,47,49,54
- packages/web/src/bindings/use-ward-detail/use-ward-detail-binding.ts: 62

## G9 cascade: `any` from a missing standalone-brand import (8)
siegelense lane-session.stub.ts:45,50 (`value` implicit any), step-contract.ts:128 (`candidate`), start-args-parse-transformer.ts:148 (`parsed`), instance-reserve-broker.test.ts:185 (PortPair `{[x:string]:any}` missing `api`,`web`): each sits next to an import that no longer exists (timeoutMsContract, fileNameContract, portPairContract fields, ...) so the type is `any`. hydration-recipes session-fields-contract.ts:38 and subagent-fields-contract.ts:56 (TS2375): `cwd: any` because `absoluteFilePathContract` is unresolved, which drops the brand out of `z.infer` and breaks the `z.ZodType<SessionFields>` upcast. Do not patch locally: fix the 2305 imports (`z.string().brand<'...Cwd'>()` or the owner's field per B4) and re-run.
- packages/hydration-recipes/src/contracts/session-fields/session-fields-contract.ts: 38
- packages/hydration-recipes/src/contracts/subagent-fields/subagent-fields-contract.ts: 56
- packages/siegelense/src/brokers/instance/reserve/instance-reserve-broker.test.ts: 185
- packages/siegelense/src/contracts/lane-session/lane-session.stub.ts: 45,50
- packages/siegelense/src/contracts/step/step-contract.ts: 128
- packages/siegelense/src/transformers/start-args-parse/start-args-parse-transformer.ts: 148

## G10 `satisfies SingleGroup` on an unbranded literal (3 x TS1360)
web/src/transformers/collect-subagent-chains/collect-subagent-chains-transformer.ts:130,184,215: `({ kind: 'single' as const, entry: e }) satisfies SingleGroup`; SingleGroup is branded (`$brand<'SingleGroup'>`) so a literal cannot satisfy it. Fix: build through the owner: `singleGroupContract.parse({ kind: 'single', entry: e })` (contract of the chat-entry-group folder), and drop the `as const`/`satisfies`.

## G11 test args wrapped in the wrong stub (8 x TS2353) - script wrong
pending-clarification-state.test.ts:18,49,66,107,127,164,192,195: `pendingClarificationState.setForProcess(PendingClarificationEntryStub({ processId, questId, questions }))`. `PendingClarificationEntryStub` builds an entry (questId, questions) and has no `processId`/`sessionId`; the argument is `{ processId } & PendingClarificationEntry`. The rule's own statement that inputs may be plain applies here too. Root fix (1 file): pending-clarification-state.ts:20-26, type the parameter from the owner's fields instead of `& PendingClarificationEntry` (the brand cannot be present on a hand-built arg):
```
}: {
  processId: string;
} & PendingClarificationEntry): void => {
}: {
  processId: string;
  questId: PendingClarificationEntry['questId'];
  questions: PendingClarificationEntry['questions'];
}): void => {
```
then in the test drop the `PendingClarificationEntryStub(...)` wrapper: `setForProcess({ processId, questId, questions })`. The lines that pass `sessionId` (127,164) are `promoteToSession({ processId, sessionId })` wrapped by mistake in the same stub: unwrap.
- packages/orchestrator/src/state/pending-clarification/pending-clarification-state.test.ts: 18,49,66,107,127,164,192,195

## G12 record-literal stubs (8 x TS2353)
web elk-position-map.stub.ts:7 and flow-edge-route-map.stub.ts:8: the DEFAULT argument literal (`'login-page': {...}`, `e1: [...]`) is checked against `StubArgument<ElkPositionMap>`, whose keys are the branded template key. Callers (elk-layout-broker.test.ts:29,64,95,154,205) pass literal keys too. Fix (2 stub files, clears all 7): the stub's parameter is a plain record, and it parses inside:
```
export const ElkPositionMapStub = (
  { ...props }: StubArgument<ElkPositionMap> = { 'login-page': { x: 0, y: 0 } },
): ElkPositionMap => elkPositionMapContract.parse({ ...props });
export const ElkPositionMapStub = (
  props: Record<string, { x: number; y: number }> = { 'login-page': { x: 0, y: 0 } },
): ElkPositionMap => elkPositionMapContract.parse(props);
```
(FlowEdgeRouteMapStub: `Record<string, readonly { x: number; y: number }[]>`). Same class: orchestrator usage-buckets-to-weighted-total-transformer.test.ts:121 `[corruptKey]:` literal key in a `buckets` arg typed by the ledger record: build the whole buckets object through `usageLedgerContract.shape.buckets.parse({...})` in the test.
- packages/orchestrator/src/transformers/usage-buckets-to-weighted-total/usage-buckets-to-weighted-total-transformer.test.ts: 121
- packages/web/src/brokers/elk/layout/elk-layout-broker.test.ts: 29,64,95,154,205
- packages/web/src/contracts/elk-position-map/elk-position-map.stub.ts: 7
- packages/web/src/contracts/flow-edge-route-map/flow-edge-route-map.stub.ts: 8

## G13 singles
- config merge-configs-transformer.ts:47 (2322, other cluster) + :51,52,59,63 (18048 x4): `merged.architecture ??= {}` assigns an unbranded `{}` to a branded field, so narrowing after it does not hold. Fix: `merged.architecture ??= dungeonmasterConfigContract.shape.architecture.unwrap().parse({})` (or read `dungeonmasterConfigContract.shape.architecture`, `.unwrap()` for the optional wrapper), clears all 5.
- hooks test/harnesses/hook-runner/hook-persistent-worker.ts:85 (TS7036): `await import(argv[2])` where `argv[2]` is `string | undefined`. Not a brand issue: `const flowPath = argv[2]; if (flowPath === undefined) { stderr.write('missing flow path\n'); exit(1); return; }`, then `import(flowPath)`.
- mcp file-scanner-broker.ts:91 (2769): `new Set<FileMetadata['path']>(sharedFilePaths.map((fp) => fp))` feeds plain glob strings to a branded set. Parse at the boundary (`fileMetadataContract.shape.path.parse(fp)`, using the currently unused `fileMetadataContract` import family) or type the Set as `Set<string>` since it is only used for membership tests later.
- orchestrator build-hydrate-input-layer-broker.ts:59 (2698, and the unused `flowNodeContract` at :10): `...blueprintAdditions` is `Partial<ModifyQuestInput>` from `reduce<Partial<ModifyQuestInput>>`; `ModifyQuestInput` is a brand intersection (or `never`) after W6, so Partial of it is not spreadable. Build the two additions through `modifyQuestInputContract.partial().parse(...)`-style or type `Partial<Pick<..>>` from the owner's fields; needs a read of `ModifyQuestInput` (shared modify-quest-input-contract) first, I did not resolve it.
- orchestrator orchestration-processes-state.proxy.ts:5 (TS1361): change `import type { OrchestrationProcessStub }` to a value import (it is called at :46). The neighbouring `type ProcessId = string` / `ReturnType<typeof QuestIdStub>` aliases are fine once the import is a value import.
- siegelense start-answer-render-transformer.ts:44 (2769): `Object.entries(value)` where `value` is `unknown` (seeded entries value from a `z.unknown()` record); narrow first: `const rowEntries = typeof value === 'object' && value !== null ? Object.entries(value) : []`, or parse the value through the seeded-row contract.
- ward playwright-json-report-contract.ts:48 (TS2375): the self-referencing getter's declared return `z.ZodOptional<z.ZodArray<z.core.$ZodType<PlaywrightSuiteSelf>>>` requires the element type to carry `z.$brand<'PlaywrightSuite'>` (line 39), but at the point of reference the array element is the `ZodObject` `$loose` schema, brand missing. Fix in that one file: drop `& z.$brand<'PlaywrightSuite'>` from `PlaywrightSuiteSelf` (the getter only needs the structural shape) and keep the outer `.brand<'PlaywrightSuite'>()` on the export; if it still errors, reorder `.loose().brand<..>()` on `playwrightSuiteContract`. Could not verify without tsc.
- packages/config/src/transformers/merge-configs/merge-configs-transformer.ts: 51,52,59,63
- packages/hooks/test/harnesses/hook-runner/hook-persistent-worker.ts: 85
- packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts: 91
- packages/orchestrator/src/brokers/quest/hydrate/build-hydrate-input-layer-broker.ts: 59
- packages/orchestrator/src/state/orchestration-processes/orchestration-processes-state.proxy.ts: 46
- packages/siegelense/src/transformers/start-answer-render/start-answer-render-transformer.ts: 44
- packages/ward/src/contracts/playwright-json-report/playwright-json-report-contract.ts: 48
