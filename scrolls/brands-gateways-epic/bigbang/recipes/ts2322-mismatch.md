# Recipe: TS2322 (non string/number) + TS2345 + TS2352 mismatch cluster

Source: `tmp/bigbang/logs/diag-r2.json`, code 2322 whose message does not start with `Type 'string' is not assignable` /
`Type 'number' is not assignable`, plus every 2345 and 2352. That filter yields **375 diagnostics in 104 files**
(309 x 2322, 42 x 2345, 24 x 2352), not ~228. Every one is placed in exactly one group below.

## ROOT FILES FIRST

Fix these before any leaf file. Counts are diagnostics in THIS cluster that the root clears.

| Root file | What it needs | Clears |
|---|---|---|
| `packages/orchestrator/src/transformers/quest-item-deep-merge/quest-item-deep-merge-transformer.ts` and `.../quest-array-upsert/quest-array-upsert-transformer.ts` (two files, one fix; G1) | Parameter type of the merge stops being the branded `ItemWithId`. | 108 (deep-merge test 52, upsert test 36, quest-modify-broker 20) |
| `packages/orchestrator/src/transformers/blight-checklist-build/blight-checklist-build-transformer.ts:100` (G2) | `baseRef` param becomes plain `string`. | 52 (build test 45, to-text test 7) |
| `packages/shared/src/contracts/flow-node/flow-node-contract.ts:31` (TS2304 `flowNodeId` undefined, other cluster) | Define `id` on the FlowNode contract. Until then FlowNode collapses to `{[x:string]:any}` with no `id`. | 8 (C2) |
| `packages/siegelense/src/contracts/port-pair/port-pair-contract.ts:17` (TS2305 `networkPortContract` gone, other cluster) | Replace the dead import. Until then PortPair infers `{[x:string]:any}`. | 7 (C3) |
| `packages/shared/src/contracts/quest/quest-contract.ts:11` (TS2307 `../absolute-file-path/...`, other cluster), also `guild/guild-contract.ts:11` (`guild-name`) | Replace dead imports. Quest and Guild infer with `[x:string]: any`. | 7 (G5) certain-ish; probably also `server-app.harness.ts:320` and `quest-mcp-create-broker.ts:63` -- re-run tsc after these two before touching G5 |
| `packages/orchestrator/src/contracts/quest-cwd-resolution/quest-cwd-resolution-contract.ts:19` (dead imports `absoluteFilePathContract`, `repoRootCwdContract`) | Replace dead imports. | 0 by itself (the 3 sites in G6 also need a stub) but do it first |
| `packages/mcp/src/contracts/tree-node/tree-node-contract.ts:13-20` (G10) | Hand-typed `TreeNodeSelf` interface is plain `name: string` while the contract's `name` is branded; `folderNameContract` import is dead. | 3 |
| `packages/web/src/state/comment-queue/...`'s guard `is-same-comment-anchor-guard` (G7) | Guard params take plain `{flowId, observableId?}`, not branded `CommentAnchor`. | 4 (comment-queue-state x3, use-comment-queue-binding x1) |

**Finding that changes how to read the whole cluster:** any error whose printed type contains `[x: string]: any` is
usually collateral of a contract that still imports a deleted standalone brand (TS2307/2305/2304 in a `-contract.ts`).
The inferred object collapses to an index signature. Full list of such contracts is in `diag-r2.json` (2305/2307/2304
on `*-contract.ts`). Clear those first; the errors named C2, C3 and G5 go away without touching their own files.

**Runtime bugs the scripts introduced (not only type errors), in groups G3a, G3b, G3d, G4, G4b:** wrapping an object
that carries functions or extra fields in an owner's `.parse()` STRIPS everything the shape does not name (zod objects
here are not `.loose()`, except where noted). `toolRegistrationContract.parse({... handler})` returns no handler, so
every MCP tool is dead at runtime. `installTestbedContract.parse({... cleanup, writeFile ...})` returns only two paths, so
`testbed.cleanup()` is undefined for every integration test that uses `installTestbedCreateBroker`. Fix these by the
spread pattern below, not by casting.

---

## G1 ItemWithId brand vs owner brand -- 108

Cause: `itemWithIdContract` is `z.object({id: z.unknown(), _delete}).loose().brand<'ItemWithId'>()` (shared). The merge
transformers use `ItemWithId` as a structural constraint, but a `Flow`, `WorkItem`, `DesignDecision` ... carries its own
brand, so it is not assignable. Also `result as Flow` (16 x TS2352 in the deep-merge test) fails for the same reason.

Root: the two transformers' signatures. Constrain on the structure, not the brand: use the contract's INPUT type
(`z.input<typeof itemWithIdContract>` is `{ [x: string]: unknown; id: unknown; _delete?: boolean }` with no brand; a
branded `Flow` is assignable to it, and `result as Flow` becomes a legal down-cast). Sketch:

```ts
// quest-array-upsert-transformer.ts (before)
export const questArrayUpsertTransformer = <T extends ItemWithId>({ existing, updates }: { existing: T[]; updates: T[] }): T[] => {
// after: T extends the plain structural shape; `updates` is the plain shape too (a modify-quest patch is partial by design)
type ItemShape = z.input<typeof itemWithIdContract>;
export const questArrayUpsertTransformer = <T extends ItemShape>({ existing, updates }: { existing: T[]; updates: readonly ItemShape[] }): T[] => {
```
Same for `questItemDeepMergeTransformer({ existing: ItemShape; update: ItemShape }): ItemShape`, and
`itemWithIdContract.parse(entry)` inside stays valid. Verify: `packages/orchestrator/.../quest-modify-broker.ts:132-147,152,167-169,207-209,276-278,283-285`
(24 sites), deep-merge test lines 28,44,46,57,59,72,74,86,88,102,104,119,121,135,137,158,160,173,175,199,222,224,235,237,272,274,305,327,463,465,491,493,512,514,541,543,
upsert test lines 19,28,39,53,65,80,101,128,144,157,178,211,227,244,264,290,311,324,333.

UNCLEAR (needs an owner decision): whether `ItemWithId` should stay branded at all (it is a constraint, not data;
B-rules say every object contract is branded). If the answer is "unbrand it", the one-line fix is in
`packages/shared/src/contracts/item-with-id/item-with-id-contract.ts` and `ItemWithIdStub` keeps working. Either way
the fix is in the root, never in the 108 sites. After the root fix, `quest-modify-broker.ts:154,169,278` still carry casts (G8).

## G2 BlightChecklistBaseRef vs QuestBaseRef -- 52

Cause: `blightChecklistContract.baseRef` is `.brand<'BlightChecklistBaseRef'>()`; the transformer takes
`baseRef: NonNullable<Quest['baseRef']>` (`QuestBaseRef`). Tests pass `BlightChecklistStub().baseRef`.

Fix (one file, `blight-checklist-build-transformer.ts:100`): inputs may be plain, and the value is parsed by
`blightChecklistContract.parse({ baseRef, ... })` at line 268 anyway.
```ts
// before
  baseRef: NonNullable<Quest['baseRef']>;
// after
  baseRef: string;
```
Sites: `blight-checklist-build-transformer.test.ts` (45 lines: 17,70,88,111,132,146,173,188,206,222,240,264,287,304,324,350,364,385,401,423,444,463,481,500,517,540,553,568,590,600,618,633,649,670,686,708,725,731,757,785,797,819,821,833,834),
`blight-checklist-to-text-transformer.test.ts` 510,529,576,589,601,629,640. Also drop the now-unused `Quest` import if nothing else uses it.
Alternative (only if the two brand texts should be one type): make `blightChecklistContract.baseRef` reuse `questContract.shape.baseRef`; it clears the same 52 but edits a shared contract.

## G3a ToolRegistration parse strips handler -- 24

Cause: script rewrote a literal `{name, description, inputSchema, handler}` to `toolRegistrationContract.parse({... 'x' as never ..., handler})`.
The contract has no `handler` field and is not loose, so the parse drops it (type error and runtime break).
`ToolRegistration = infer & { handler: ToolHandler }`.

Fix per site (`architecture-flow.ts` 33,41,48,55,62,70; `interaction-flow.ts` 29,41,53; `quest-flow.ts` 56,62,68,75,81,87,94,102,110,124,131,138,145,152): parse the data fields, spread, add the handler, drop every `as never`.
```ts
// before (architecture-flow.ts:33)
  toolRegistrationContract.parse({
    name: 'discover' as never,
    description: '...' as never,
    inputSchema: discoverSchema as never,
    handler: async ({ args, meta }) => ArchitectureHandleResponder({ tool: 'discover' as never, args, meta }),
  }),
// after
  {
    ...toolRegistrationContract.parse({ name: 'discover', description: '...', inputSchema: discoverSchema }),
    handler: async ({ args, meta }) => ArchitectureHandleResponder({ tool: 'discover', args, meta }),
  },
```
`tool: 'discover' as never` -- check the responder's `tool` param type; if it is a branded owner field, parse via that owner's field, not `as never`.
`mcp-server-flow.ts:49`: `handlerMap` is keyed by branded `reg.name` but looked up by a raw `request.params.name`. Key the map with `String(reg.name)` (or parse the lookup through `toolRegistrationContract.shape.name`). Line 45's `.parse(reg)` on the list path is correct (handler must not be sent).
Not fixable in one root: the contract could carry `handler` via `z.custom<ToolHandler>`, but then `parse({... async ({args,meta}) => ...})` gets implicit-any params, so the spread pattern is still needed.

## G3b RecipeCatalogEntry parse strips functions -- 9

Cause: `recipeCatalogEntryContract.parse({ recipeName, description, probeListing, execute })` in `recipes-catalog-broker.ts` (lines 45,67,89,111,146,168,203,238,260). Contract holds only `recipeName/description/inputs`; `RecipeCatalogEntry = Data & { probeListing; execute }`. Parse drops both functions.
```ts
// after
  {
    ...recipeCatalogEntryContract.parse({ recipeName: recipesGuildEmptyBroker.recipeName, description: recipesGuildEmptyBroker.description }),
    probeListing: () => { ... },
    execute: async ({ params, target }) => { ... },
  },
```
The `sessionWithNestedSubagentMeta` at line 38 already does this correctly for its two data fields.

## G3c OrchestrationProcess parse strips kill -- 8

Cause: `orchestrationProcessContract.parse({ processId, questId, kill })`. Contract is `.loose()` so at runtime `kill` survives, but the parse return type has no `kill`; type = `infer & { kill: () => void }`.
```ts
// before (quest-modify-responder.ts:46)
orchestrationProcessesState.register({ orchestrationProcess: orchestrationProcessContract.parse({ processId, questId: typedQuestId, kill: () => { abortController.abort(); } }) });
// after
orchestrationProcessesState.register({ orchestrationProcess: {
  ...orchestrationProcessContract.parse({ processId, questId: typedQuestId }),
  kill: () => { abortController.abort(); },
} });
```
Sites: `chat-start-responder.ts:395`, `followup-chat-start-responder.ts:147`, `orchestration-dispatch-bootstrap-responder.ts:67`, `orchestration-resume-responder.ts:210`, `orchestration-start-responder.ts:181`, `recover-guild-layer-responder.ts:165`, `quest-modify-responder.ts:46`, `enqueue-bundled-suite-layer-responder.ts:58`. (`questWorkItemId` stays in the parsed part.)

## G3d function-bearing objects wrapped in parse (testing, mcp) -- 11

Same mechanism as G3b/G3c. Contracts hold data only (`MockHandle`, `MockStaging`, `EndpointControl`, `EndpointMockLifecycle`, `StagedCall`, `IsolateModulesMock` are `.loose()`, so runtime is fine; `InstallTestbed` and `TestGuild` are NOT loose, so runtime is broken).
```ts
// before (mock-register-middleware.ts:87)
const record: StagedCall = stagedCallContract.parse({ args, impl: () => undefined, once: false, consumed: false });
// after
const record: StagedCall = { ...stagedCallContract.parse({ args, once: false, consumed: false }), impl: () => undefined };
```
Sites: `mock-register-middleware.ts` 84 (handle), 87; `spy-on-register-middleware.ts` 100, 103; `endpoint-mock-listen-responder.ts:57`; `endpoint-mock-setup-responder.ts` 29, 61; `mock-staging-create-transformer.ts:25`; `mcp/src/index.proxy.ts:36` (`{ ...isolateModulesMockContract.parse({ module }), factory }`); `install-testbed-create-broker.ts:84` and `integration-environment-create-broker.ts:107` (`{ ...installTestbedContract.parse({guildPath, dungeonmasterPath}), cleanup, writeFile, ... }`; keep the existing `.shape.x.parse` field parses inside the parse arg).
For `MockHandle`, `handle.calledWith` is referenced from `onceFor` inside the same literal, so declare `const handle: MockHandle = { ...mockHandleContract.parse({}), calledWith: ..., onceFor: ..., ... }`.

## G4 pending clarification: parse strips processId -- 11

Cause: `pendingClarificationEntryContract.parse({ processId, questId, questions })` (and `PendingClarificationEntryStub({ processId, ... })`) removes `processId`; `setForProcess` needs `{ processId: string } & PendingClarificationEntry`. Runtime: entries would be stored under `undefined`.
```ts
// before (chat-start-responder.ts:314)
pendingClarificationState.setForProcess(pendingClarificationEntryContract.parse({ processId: chatProcessId, questId: chatQuestId, questions: clarification.questions }));
// after
pendingClarificationState.setForProcess({ processId: chatProcessId, ...pendingClarificationEntryContract.parse({ questId: chatQuestId, questions: clarification.questions }) });
```
Test/proxy: `setForProcess({ processId, ...PendingClarificationEntryStub({ questId, questions }) })`.
Sites: `chat-start-responder.ts:314`; `pending-clarification-state.proxy.ts` 26, 36; `pending-clarification-state.test.ts` 18,49,66,107,127,164,192,194.

## G4b HydrationTargetStub strips home -- 1

`hydration/test/harnesses/file-target/file-target.harness.ts:81`: `HydrationTargetStub({ home: testbed.guildPath })` parses away `home` (`FileTarget = HydrationTarget & { home: string }`).
Fix: `return { ...HydrationTargetStub(), home: testbed.guildPath };`

## G5 FieldValuesFor settable index-signature -- 7 (probably collateral)

Cause (from the message): `Settable<I>` intersects `Partial<Record<any, StatusUnion>>` because `Quest`/`QuestFields` infer with `[x: string]: any` (dead imports in `quest-contract.ts`), so `TransitionField & keyof FieldsOf` becomes `any` and every non-status field (`title`, `flows`) must be a status. Sites: `quest-ingredient-broker.integration.test.ts:90`, `recipes-guild-with-three-quests-broker.ts` 74,77 (2 diagnostics each), `web/test/harnesses/quest/quest.harness.ts` 362,397.
Do not touch these until the Quest/Guild contract imports are fixed and tsc re-run. If they persist, the file is `packages/hydration/src/contracts/ingredient-handle/ingredient-handle-contract.ts:74-77` (`Settable`).

## G6 plain literal into a branded object -- 37

Cause: a literal object goes where an object contract's type (with its brand) is required. Prod code: build it through the owner's `.parse(...)`. Tests: use the owner's stub.
```ts
// before (orchestrator quest-section-filter-transformer.ts:37)
filtered.planningNotes = { blightLedger: [], questNotes: [], operationPlans: [] };
// after
filtered.planningNotes = questContract.shape.planningNotes.parse({ blightLedger: [], questNotes: [], operationPlans: [] });
```
```ts
// before (lane-provision-batch-broker.test.ts:23)
laneProvisionBatchBroker({ quest, step: { type: 'idle' } });
// after: NextStep owner stub (or the contract's parse) -- pick the stub the package already has
laneProvisionBatchBroker({ quest, step: NextStepStub({ type: 'idle' }) });
```
Sites and owner to use:
- `lane-provision-batch-broker.test.ts` 23,58,90,135,206,235,276 -- `NextStep` (spawn-agents batches: `NextStepStub`)
- `quest-work-plan-write-broker.test.ts` 46,162 -- `PlanEnvelopeFields`
- `quest-work-record-broker.test.ts` 314,328 -- `ObservationFields`
- `quest-handle-responder.test.ts:1009`, `orchestrator quest-flow.integration.test.ts:59`, `server quest-flow.integration.test.ts:193`, `quest-section-filter-transformer.ts:37` -- `QuestPlanningNotes`
- `quest-work-layer-responder.test.ts:18` -- `QuestWorkRecordResult`
- `agent-prompt-get-broker.proxy.ts` 79,158,165 -- `QuestCwdResolution` (`{kind, cwd}`; also needs the contract's dead imports fixed)
- `git-rows-layer-broker.ts` 58,78 -- `QuestWorkGit` (`questWorkGitContract.parse({ baseBranch, worktreePath, baseRef })`)
- `signature-extractor-transformer.ts` 106 (`SignatureParameter`), 135 (`FunctionSignature`) -- wrap the returned literal in the owner's parse
- `merge-configs-transformer.ts:47` -- `merged.architecture ??= {}` becomes `dungeonmasterConfigContract.shape.architecture.parse({})` (or the architecture sub-contract's parse)
- `recipe-catalog-entry-contract.test.ts:60` -- `runs: { serverless: true }` needs `PlanRunsResult` from its stub in `@dungeonmaster/hydration`
- `quest-clarify-broker.test.ts` 20,43,63,85 -- literals with `'x' as never` (an existing forbidden cast that no longer compiles): use `ClarificationQuestionStub` / the `AskUserQuestion` owner stub
- `quest-modify-response.stub.ts:5` and `quest-modify-response-contract.test.ts:18` -- default value `{ success: true }` / `{ success: false, error }` must be a parse: change the stub default to `questModifyResponseContract.parse({ success: true })`
- `collect-subagent-chains-transformer.ts` 129,182,213 -- `{ kind: 'single', entry: e } satisfies SingleGroup` becomes `singleGroupContract.parse({ kind: 'single', entry: e })` (or the group's stub)
- `server-app.harness.ts:320` -- `result[QUEST_SAVE_NAME]!` is a Quest without its brand; re-check after the Quest contract collapse is fixed, else `questContract.parse(...)`
- `quest-mcp-create-broker.ts:63` -- `selectedGuild: Guild | GuildListItem` annotation does not fit `coveringGuild` (a `GuildListItem`); annotate as `GuildListItem`, or read only the id
Note: several of these outputs were `as never` casts in the original; do not restore a cast.

## G7 cross-owner brand mismatch -- 25

Cause: the same underlying value carries brand text A (its owner) and flows into a field whose brand text B is a different owner's. Fix by parsing at the receiving boundary through the RECEIVING owner's field, or by making the receiving parameter plain `string` when it is an input.
```ts
// before (extract-task-description-transformer.ts:33)
return result.data.description;                     // TaskToolInputDescription into ChainDescription
// after
return subagentChainGroupContract.shape.description.parse(result.data.description);
```
Sites (source brand -> target brand, fix):
- `graph-reachability-violations-transformer.ts` 62,63,64,69: `Set`/queue/Map typed by `RoutedGraphEntry` but fed `RoutedGraphNodeRoutes`. Type the local collections `Set<string>` / `string[]` / `Map<string, ...>` (they are local working values).
- `use-comment-queue-binding.ts:51`, `comment-queue-state.ts` 86 (x2), 96: `CommentQueueEntry` passed where `CommentAnchor`. Root: the anchor guard's params (see ROOT FILES).
- `op-save-record-apply-layer-broker.ts:21`: `OpSaveRecordName` as key of a `HydrationRunStateSavedKey` map: `state.saved.set(hydrationRunStateContract.shape.saved.keySchema.parse(op.name), ...)`.
- `mcp-discover-broker.ts:83`: `FileMetadataName` etc. into `DiscoverListItemName`: build the tree items through `discoverListItemContract.parse({...})`.
- `quest-handle-responder.ts:266`: `CreateQuestInputUserRequest` into `createQuestForMcp`'s `AddQuestInputUserRequest`: parse through the receiver's field, or make that parameter `string`.
- `quest-work-record-broker.ts` 98 (`OutcomePayloadReason` -> `WorkItemDeclaredReason`), 162 (`RequestPayloadStep` -> `WorkItemRequestedStep`, `RequestPayloadReason` -> `WorkItemRequestedReason`): `workItemContract.shape.<field>.unwrap().parse(...)`.
- `quest-work-units-transformer.ts:59`: `UnitCurrentMarkEvidence` -> `UnitObservationFieldsEvidence`.
- `quest-resolved-observable-packages-transformer.ts:16`: `FlowNodePackages` -> `FlowObservablePackage` (`flowObservableContract.shape.package.parse(pkg)` when stamping the node package onto observables).
- `apply-overrides-transformer.ts:40`: `DungeonmasterConfigArchitectureOverridesAdd` into `PackageName[]`: parse each added name through the framework preset's own element schema.
- `siegelense-results-layer-flow.ts:28`: `ResultsArgsStep` -> `ResultsQueryStep`: `resultsQueryContract.parse(query)`.
- `network-record-capture-broker.ts:56`: `NetworkLogEntryRequestBody` -> `PendingRequestRequestBody`: `pendingRequestContract.shape.requestBody.unwrap().parse(...)` (it already parses once via `networkLogEntryContract`; parse once through the RECEIVER).
- `proxy-mock-collector-middleware.ts:117`: `ProxyImportEdgeNames` -> `ProxyMockQueueEntryRequestedNames`: compare on `String(name)` via a `Set<string>`.
- `adapter-census-build-broker.ts:104`: `CensusPackage` -> `PackageCensus`: two contracts describe one thing; use one (parse through `adapterCensusContract`'s own `packages` element).
- `multi-package-layer-broker.ts:217`: `CheckResultDurationMs` -> `ProjectResultDurationMs`: `{ ...projectResult, durationMs: projectResultContract.shape.durationMs.parse(Number(c.durationMs)) }`.
- `result-to-detail-transformer.ts:51`: `PassingTestSuitePath` vs `TestFailureSuitePath|ErrorEntryFilePath`: type `filePath?: string`, see G11 for the rest of that file.
- `web-socket-channel-state.test.ts:515`: `WardDetailResponseWardResultId` into `WardResultId`: `sendWardDetailRequest` should take the response's own field type, or the test passes `WardResultStub().id`.
UNCLEAR: whether the two brand texts in each pair should be one brand. The rules make each owner brand distinct, so parse-at-boundary is the mechanical answer; a pair where the value is a straight hand-off (adapter-census, ward duration) is a smell the owner may want to collapse.

## G8a modify-broker casts of partial patches -- 9 diagnostics (4 lines)

`quest-modify-broker.ts` 154, 169, 278 (x2 counted twice) `validated.X as typeof quest.X`, and 272 `validated.title as typeof quest.title` (`ModifyQuestInputTitle` -> `QuestTitle`).
272 fix: `quest.title = questContract.shape.title.parse(validated.title);`
154/169/278: a modify-quest patch is PARTIAL by design (that is why it was cast), so `questContract.shape.flows.parse(...)` would reject valid patches. These become unnecessary once G1's `updates` is typed `readonly ItemShape[]`: drop the casts and pass `validated.flows` directly. UNCLEAR until G1 is in.

## G8b unknown to string -- 25

Cause: a `.parse()` through a deleted standalone brand contract (`filePathContract`, `contentTextContract`, ...) was stripped, but the value still comes from `Record<string, unknown>` / `unknown`, so the narrowing that the parse provided is gone.
```ts
// before (session-remove-route-broker.ts:18)
await rm(record.filePath);
// after: parse through the owner of that field (sessionRecordContract has filePath)
await rm(sessionRecordContract.shape.filePath.parse(record.filePath));
```
Sites and the owner to parse through:
- hydration-recipes: `session-remove-route-broker.ts:18` (SessionRecord.filePath); `session-query-route-broker.ts:34`, `session-nested-chain-broker.ts:57`, `session-write-route-broker.ts` 53,56 (SessionRecord/SessionFields `.cwd`); `subagent-query-route-broker.ts:48` (`cwd` via SubagentFields); `subagent-remove-route-broker.ts:18` (SubagentRecord.filePath); `recipes-guild-active-suite-broker.integration.test.ts:80` (`guild.path` via `guildContract.shape.path.parse`); `live-quest-target.harness.ts` 139,140 (`guildFieldsContract.parse(body)` then use `.name/.path`). Blocked on those record/fields contracts still importing dead `absoluteFilePathContract` (TS2305): fix that import first, then `.shape.cwd.parse` works.
- web e2e/harness `GuildIdStub({ value: guild.id })` (guild is `Record<PropertyKey, unknown>`): use `guildId: guilds.extractGuildId({ guild })` (exists in guildHarness) or `guildId: String(guild.id)` since harness params take raw strings. Sites: `guild-delete.e2e.ts` 25,44,60; `spec-panel-edit-mode-removed.e2e.ts` 82,219,272,365,424,474; `persisted-comments.harness.ts:393`; `sticky-header.harness.ts:235`; `subagent-launch-order.harness.ts:316`.
- `dispatch.harness.ts:347`: `processId: (body as Record<PropertyKey, unknown>).processId` -> `processId: String(...)`.
- `browser-session-launch-broker.ts:366`: `contentTextContract.array().parse(raw)` (dead export) -> `z.array(z.string()).parse(raw)` via the gateway zod.
- `local-image-copy-broker.proxy.ts:54`: `writeProxy.getCallsFor(...)` now returns `unknown[]`; UNCLEAR, look at the gateway proxy's return type first (`#gateway/node/fs__promises` write proxy); the proxy should type its own calls, the caller should not cast.

## G9a ModifyQuestInput built as a literal and cast -- 5

Cause: `{ questId, workItems } as ModifyQuestInput` (or `Partial<ModifyQuestInput>` accumulators) where the fields are owner types (`WorkItem`, `DesignDecision`, `QuestContractEntry`) and `ModifyQuestInput` wants its `...ForUpsert` variants plus its own brand.
```ts
// before (quest-work-item-insert-broker.ts:47)
questModifyBroker({ input: { questId, workItems: updatedWorkItems } as ModifyQuestInput });
// after
questModifyBroker({ input: modifyQuestInputContract.parse({ questId, workItems: updatedWorkItems }) });
```
Sites: `quest-work-item-insert-broker.ts:48`, `clarify-answer-responder.ts:28`, `comment-batch-responder.ts:41`, `build-hydrate-input-layer-broker.ts` 37 (the `reduce<Partial<ModifyQuestInput>>` accumulator: accumulate a plain `Record<string, unknown>` and parse once, which line 57 already does) and 54 (`flowsAdditions`).

## G9b string|undefined -- 5

Cause: `.parse(x)` that accepted `unknown` was removed; indexing/`.filter` no longer narrows.
```ts
// before (lane-boot-broker.ts:80-84)
.filter(([, value]) => value !== undefined).map(([key, value]): [PropertyKey, string] => [key, value])
// after
.flatMap(([key, value]): [PropertyKey, string][] => (value === undefined ? [] : [[key, value]]))
```
Sites: `instance-start-broker.ts:254`, `lane-boot-broker.ts:83`, `lane-boot-broker.proxy.ts:237` (same flatMap); `extract-first-segment-transformer.ts:17` -> `const segment = match?.[1] ?? '';`; `profile-measured-date-render-transformer.ts:23` -> `const [datePart = ''] = ...split('T');`.

## G10a TreeNodeSelf -- 3 (root: `tree-node-contract.ts`)

`interface TreeNodeSelf { name: string; ... }` versus a contract whose `name` is `.brand<'TreeNodeName'>()`. Make `name` in the interface `z.infer<typeof ...>`-compatible (a branded string type derived from the contract) and replace the dead `folderNameContract` key with a plain `z.string()`. Sites: `format-tree-node-transformer.ts:41`, `tree-formatter-transformer.ts` 69, 98. (`treeNodeContract.parse({ name: folderName, ... })` at `tree-formatter-transformer.ts:62` is the correct pattern for the leaves.)

## G10b harness interface vs impl disagree -- 4

The last repair commit made harness parameters raw again in the interface, but the implementation kept branded types. Change the implementation to the interface's raw type and parse inside.
```ts
// guild.harness.ts:99 (interface says { guildId: string })
// before
const deleteGuild = async ({ guildId }: { guildId: Guild['id'] }): Promise<void> => {
// after
const deleteGuild = async ({ guildId }: { guildId: string }): Promise<void> => {   // body already parses via guildContract.shape.id.parse(guildId)
```
Sites: `guild.harness.ts:124` (deleteGuild); `quest.harness.ts` 1377,1378 (the two impls at ~1341 and ~1360 take `questId: Quest['id']`/typed; make them `string` and parse inside if needed); `dispatch.harness.ts:248` (interface line 104 says `Promise<{ questId: Quest['id']; questFolder: Quest['folder']; ... }>` but impl returns plain strings from `quests.createQuest`; change the interface return to `string`s).

## G11a plain string/number into an owner-branded field -- 4

- `relay-tail-fan-out-transformer.ts:247`: `packageNames: string[]` where `OperationItemPackageNames[]` is required: parse through `operationItemContract.shape.packageNames.parse(...)`.
- `owner-index-from-sources-transformer.ts:70`: `brandText: string` -> `ownerIndexFieldContract.shape.brandText.unwrap().parse(onlyText)`.
- `proxy-mock-collector-middleware.ts:80`: `{ ...mock, moduleName: absoluteModuleName }` puts a plain string into `MockCallModuleName`: `mockCallContract.shape.moduleName.parse(absoluteModuleName)`.
- `compute-token-annotations-transformer.ts:54`: `contextDelta = ... Number(a) - Number(b)`: `tokenAnnotationContract.shape.contextDelta.unwrap().parse(...)`.

## G11b ward ErrorEntry message list -- 7 (one file)

`result-to-detail-transformer.ts`: `const entries: ErrorEntry['message'][] = []` is a list of display LINES, not error messages. Type it `string[]`, delete the `as ErrorEntry['message']` casts at lines 45,46,54, and type `filePath?: string`. Clears 63,83,96,108,112,134,150 (and 51 from G7). Then `stripAnsiCodesTransformer` gets a plain string.

## G12 accumulator typed as owner field -- 5 (one file)

`source-facts-extract-statements-layer-broker.ts`: `imports`, `reExports`, `exportNames` are typed `SourceFacts['imports'|...]` (branded elements), then pushed plain strings from `ts` node text. The function already ends in `sourceFactsContract.parse({...})`, so make the accumulators plain (`{ specifier: string; names: string[] }[]`, `string[]`) and let that single parse brand them. Lines 36, 57, 64, 67, 83.

## C2 / C3 collateral (do not edit the leaf files)

- C2: `has-duplicate-id-in-array-guard.test.ts` 11,19,32,45,56 and `quest-find-duplicate-id-transformer.test.ts` 15,31,49 -- the message says FlowNode has no `id` ("Property 'id' is missing"); `flow-node-contract.ts:31` uses an undefined `flowNodeId`. Root fix only.
- C3: `instance-reserve-broker.test.ts` 43,90,119,157,235,256,281 -- `PortPair` has no `api`/`web` because `port-pair-contract.ts:17` imports the deleted `networkPortContract`. Root fix only.
