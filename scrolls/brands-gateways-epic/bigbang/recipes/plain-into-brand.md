# Recipe: plain string/number going into a branded slot (TS2322 / TS2345)

Source: `tmp/bigbang/logs/diag-r2.json`, 238 errors in 89 files (a filtered copy sits in `tmp/bigbang/logs/r2-plain.json`).
Every line number below is from that log.

Root cause behind almost all of it: an earlier script retyped **input** parameters from `string` to
`Owner['field']` (and typed hand-built local accumulators as the branded type). The rules say returns are branded,
inputs MAY be plain, harnesses and proxies take raw input. So the fix is nearly always (a): loosen the receiving
parameter to `string`/`number`, and let the code that already parses inside (or the return) do the branding.

## ROOT FILES FIRST (one change each; the count is errors cleared elsewhere or in-file)

| Count | Root file | Change |
|---|---|---|
| 107 | `packages/web/test/harnesses/navigation/navigation.harness.ts` line 22 | interface `navigateToQuest: (params: { urlSlug: string; questId: Quest['id'] })` becomes `questId: string`. The impl (line 30+) already says `questId: string`. Clears every e2e/harness `nav.navigateToQuest({ questId })` call. |
| 16 (+1) | `packages/web/test/harnesses/quest/quest.harness.ts` | Interface lines 251, 268, 275, 303 (`patchQuestStatus`, `forceStatusRebroadcast`, `patchQuestFlows`, `seedPausedAtStatus`) and the impl params at 970, 1044, 1075 (`resolveQuestOwningGuildId`, `startQuest`, `pauseQuest`) go from `Quest['id']` to `string`. Clears 8 (`forceStatusRebroadcast`) + 4 (`seedPausedAtStatus`) + 2 (`patchQuestFlows`, quest-ws-update) + 2 (own lines 1008, 1272). Also line 101: `createQuest` `guildId: Guild['id']` to `string`, which clears `dispatch.harness.ts:258` (+1). |
| 12 | `packages/orchestrator/src/brokers/ward/persist-result/ward-persist-result-broker.ts` line 22 AND `...broker.proxy.ts` (lines 22,27,30,33,34,46,64,76,91,102) | `wardResultId: WardResult['id']` becomes `string`. Only used to build a path. Clears the 12 test errors. |
| 12 | `packages/orchestrator/src/brokers/quest/node-dispatch-loop/spawn-batch-layer-broker.proxy.ts` lines 21, 59 | `guildPath: Guild['path']` becomes `string`. It only feeds a `QuestCwdResolutionStub({ cwd })` (check that stub; if it needs the brand, parse there). |
| 8 | `packages/web/src/guards/is-quest-update-stale/is-quest-update-stale-guard.ts` lines 33-34 | `Quest['updatedAt']` becomes `string` (a comparison only). |
| 7 | `packages/ward/src/transformers/result-to-detail/result-to-detail-transformer.ts` lines 29 and 74 | accumulators `ErrorEntry['message'][]` become `string[]`; drop the `as ErrorEntry['message']` casts. |
| 7 | `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts` + `ward-mock/ward-mock.harness.ts` | `getScopedQueueDir` param `Guild['path']` becomes `string` (lines 73 / 51: clears 4 + 3); `setCounter` param `ReturnType<typeof getCounter>` becomes `number` (lines 92 / 70: clears the 2 `QueueMetadataCounter` errors, 108 / 86). That is 9 in the two files. |
| 6 | `packages/orchestrator/test/harnesses/orchestration-quest/orchestration-quest.harness.ts` line 69 | `type BranchName = NonNullable<Quest['branchName']>` becomes `type BranchName = string`. It is spread into JSON and persisted, never parsed. Clears the 6 in `quest-handle-signal-back-responder.integration.test.ts`. |
| 5 | `packages/web/test/harnesses/claude-mock/claude-mock.harness.ts` lines 102, 141, 160 | `response: ClaudeQueueResponse` becomes a plain input shape (`{ sessionId: string; lines: string[]; exitCode?: number; delayMs?: number; signalBack?: boolean; hang?: boolean }`). The harness already runs `claudeQueueResponseContract.parse(response)` at line 107. Clears 5 e2e `lines:` errors. (If the object brand on ClaudeQueueResponse then complains at those call sites, that is a different cluster and the same fix covers it.) |
| 3+ | `packages/orchestrator/src/errors/quest-not-found/quest-not-found-error.ts` line 14, and the three responders (`get-planning-notes` line 23, `get-summary` line 28, `get-projection` line 25) | `questId: Quest['id']` becomes `string`. Each responder already calls `questContract.shape.id.parse(questId)` inside. Clears 4 test errors (all `questId: ''`). |
| 2 | `packages/shared/src/transformers/name-to-url-slug/name-to-url-slug-transformer.ts` | return the owner's field: `return guildContract.shape.urlSlug.parse(slug);` and fix `name: string \| string` to `string`. Clears `guild-get-broker.ts:28` and `guild-list-broker.ts:29`. Check that the `urlSlug` contract accepts what this returns (an empty name gives `''`). |
| 2 | `packages/web/test/harnesses/followup/followup.harness.ts` lines 90-91, and `quest-approved-modal/quest-approved-modal.harness.ts` line 75 | return types `questId: Quest['id']` become `string` (the values come from `createQuest`, which returns `questId: string`). Clears followup 186 and modal 112. |
| 2 | `packages/shared/src/brokers/cwd/resolve/guild-path-walk-up-layer-broker.proxy.ts` line 11 and `cwd-resolve-broker.proxy.ts` lines 18, 77 | `guildPath: Guild['path']` becomes `string`. Clears the two shared tests (24, 90). |
| 1 | `packages/orchestrator/src/errors/guild-not-found/guild-not-found-error.ts` line 14 | `guildId: Guild['id']` becomes `string` (interpolated only). Clears the test at line 20. |
| 1 | `packages/server/src/responders/server/init/server-init-responder.proxy.ts` lines 101, 277 | `WardResult['id']` becomes `string`. Clears the test at line 188. |

## Groups (root cause, one line, count)

1. QuestId (129): retyped harness/error/responder INPUT params, plus harness return types; fix (a). Roots above. Split: 107 nav, 8 `forceStatusRebroadcast`, 4 `seedPausedAtStatus`, 2 `patchQuestFlows`, 2 `resolveQuestOwningGuildId`, 2 harness returns, 4 orchestrator `questId: ''`.
2. FileMetadataPath (24): `packages/mcp/src/transformers/{file-base-path,path-to-basename,path-to-relative}`. Input retyped to the brand, and the return is an unparsed string. (a) input and (b) parse the return.
3. GuildPath (21): proxy and harness inputs. (a).
4. WardResultId (13): broker and proxy inputs. (a).
5. QuestUpdatedAt (8): guard input. (a).
6. ErrorEntryMessage (7): local accumulators typed with the brand. (a) plain local, returns `string` already.
7. QuestBranchName (6): harness type alias. (a).
8. ClaudeQueueResponseLines (5): harness `queueResponse` input. (a).
9. SourceFacts* (5): local accumulators typed with the brand, and the function already ends in `sourceFactsContract.parse`. (a) plain locals.
10. AdapterCensusTotals* (6): a returned object of counts. (b) parse at the return.
11. CreatePackageArgs* (3): `parsed: Partial<CreatePackageArgs>` accumulator, and the function already ends in `.parse`. (a) plain local.
12. GuildUrlSlug (2): a transformer returns plain where the owner field is the return type. (b).
13. GuildId (2): `GuildNotFoundError` input (a) and `createQuest` input (a).
14. QueueMetadataCounter (2): harness `setCounter` param. (a).
15. Singles: `ToolRegistrationName` (mcp-server-flow 49), `SessionFieldsShapeLines` (recipes broker 50), `QuestWorkRecordResultStep` (mcp test 44), `ScenarioInstanceCallOrdinals` (smoketest state 63), `RoutedGraphEntry` (graph-reachability 69). See the end of this file.

## Fix patterns with real snippets

### A. Input param retyped to the brand (the dominant case)
```ts
// navigation.harness.ts:22   before
navigateToQuest: (params: { urlSlug: string; questId: Quest['id'] }) => Promise<void>;
// after
navigateToQuest: (params: { urlSlug: string; questId: string }) => Promise<void>;
```
```ts
// quest-not-found-error.ts:14   before
public constructor({ questId }: { questId: Quest['id'] }) {
// after (the message only interpolates; no brand is needed)
public constructor({ questId }: { questId: string }) {
```
When the callee needs the brand it parses inside, as the responders already do (`questContract.shape.id.parse(questId)`).
Remove the now-unused `import type { Quest }` if nothing else uses it. Tests that pass `''`, `'/dm/guilds/foo'`
or `'run-1773805659495'` then stay as literals and need no stub.

### B. Local accumulator typed with the branded type, parsed at the end anyway
```ts
// result-to-detail-transformer.ts:29   before
const entries: ErrorEntry['message'][] = [];
entries.push(`  ${check.checkType}${rulePart}${locationPart}` as ErrorEntry['message']);
entries.push(`\n  Network Log:\n    ${networkLog}`);   // TS2345 here
// after
const entries: string[] = [];
entries.push(`  ${check.checkType}${rulePart}${locationPart}`);
```
The same for `sections` (line 74). It returns `string`, so nothing is branded.

`source-facts-extract-statements-layer-broker.ts` lines 15-21: `imports`, `reExports`, `exportNames` are typed
`SourceFacts[...]`, and line 87 already does `sourceFactsContract.parse({...})`. Declare them plain:
```ts
const imports: { specifier: string; names: string[] }[] = [];
const reExports: { specifier: string; names: string[]; isStar: boolean }[] = [];
const exportNames: string[] = [];
```
(errors at 35, 56, 64, 67, 83).

`create-package-args-parse-transformer.ts` line 42, `const parsed: Partial<CreatePackageArgs> = {}`, becomes a plain shape
`{ name?: string; packageType?: string; description?: string; packagesDir?: string; dryRun?: boolean }`. Line 123 already parses
(errors at 55, 88, 101). Keep `parsed.packageType = packageTypeContract.parse(value)` as is.

### C. Return is unparsed: parse at the owner (b)
```ts
// file-base-path-transformer.ts   before
filepath: FileMetadata['path'];  ...  }): FileMetadata['path'] => {
  const basePath = filepath.replace(EXTENSION_PATTERN, '');
  return basePath;                       // TS2322 line 19
// after
filepath: string;  ...  }): FileMetadata['path'] => {
  const basePath = filepath.replace(EXTENSION_PATTERN, '');
  return fileMetadataContract.shape.path.parse(basePath);
```
The file already imports `fileMetadataContract`. Same shape for `path-to-basename-transformer.ts:19` and
`path-to-relative-transformer.ts:25`, where `cwd: string` is already plain. Check the contract's actual field name.
The tests need no change (21 test errors vanish once `filepath` is `string`).

`adapter-census-totals-transformer.ts` lines 21-28:
```ts
return adapterCensusContract.shape.totals.parse({
  adapters: adapters.length, ...
});
```
It needs the value import `adapterCensusContract` beside the type import. Clears 22-27.

`name-to-url-slug-transformer.ts`: `return guildContract.shape.urlSlug.parse(slug);` (see the table).

### D. Tests: plain literal into a plain-input proxy or harness
Never wrap in a stub. After the root loosens the input, the test literal is correct. Use the owner's stub only where a
test builds an OBJECT that goes into a branded object slot (a different cluster).
`is-quest-update-stale-guard.test.ts`: the ISO literals stay.

## Singles

- `mcp-server-flow.ts:49` `handlerMap.get(request.params.name)`: the Map is keyed by branded `reg.name`, and the lookup key is a wire string. Widen the key: `new Map<string, ...>(registrations.map((reg) => [String(reg.name), reg.handler]))` (line 42). (a).
- `recipes-session-with-nested-chain-broker.ts:50`: `s[0].set({ lines: [streamLineToJsonLineTransformer(...)] })` — the `set()` builder input is typed on the branded session-fields shape (`session-fields-contract.ts:33`, `z.array(z.string().min(1).brand<'SessionFieldsShapeLines'>())`). Its input should be plain: the contract is already exported as `ZodType<SessionFields, z.input<...>>`, so type `set`'s parameter from that input type in the recipe DSL and let it parse. If that is not reachable from the file, report BLOCKED with the DSL file (`dm-registry-broker` / recipes-hydration builder).
- `quest-work-layer-responder.test.ts:44` `result: { kind: 'request', step: 'recipe' }`: `step` is branded `QuestWorkRecordResultStep`. Root is the proxy (`quest-work-layer-responder.proxy.ts`, `result: QuestWorkResult`): let `setupReturns` accept a plain input and parse inside with the orchestrator's `questWorkRecordResultContract`. If the test may import an orchestrator stub, use `QuestWorkRecordResultStub({ kind: 'request', step: 'recipe' })` (orchestrator `quest-work-record-result.stub.ts` exists). The responder's own test may not import another package, so prefer the proxy fix.
- `smoketest-scenario-state.ts:63` `instance.callOrdinals[role] = ordinal + 1` (a mutation with a plain number): rebuild through the owner: `state.instances.set(questId, scenarioInstanceContract.parse({ ...instance, callOrdinals: { ...instance.callOrdinals, [role]: ordinal + 1 } }));`. (b)
- `graph-reachability-violations-transformer.ts:69`: `reachableFromEntry` is a `Set` of `graph.entry` (branded), and `stepKey` from the `nodesMap` keys is plain. Declare `const reachableFromEntry = new Set<string>([graph.entry]);` and `const reachabilityQueue: string[] = [graph.entry];` (lines 50-51). (a)

## Caveats for fixers

- After changing a proxy/harness param to `string`, a `Quest['id']` value passed in still type-checks, since a brand is a subtype of `string`.
- If a root file is outside a fixer's batch, report it under BLOCKED with the file and line numbers from the table.
- Do not cast. Do not wrap test literals in stubs of deleted standalone brands (`QuestIdStub`, `GuildPathStub`, ...).

## Full file:line list per group

QuestId 129: nav sites (107), e2e files `packages/web/src/flows/{home,quest-chat,session-view}/*.e2e.ts` at every line in the log where `questId` follows `navigateToQuest`, plus harness sites `flow-diagram.harness.ts:453`, `followup.harness.ts:173,197`, `sticky-header.harness.ts:258`, `subagent-launch-order.harness.ts:338`, and the home e2e files `quest-approve.e2e.ts:67`, `quest-begin-transition.e2e.ts:102,223,365,535`. Non-nav (22): `elapsed-duration-finished.e2e.ts:237,483,566,649`, `elapsed-duration-tick.e2e.ts:277,639`, `subagent-duration-notification-arrives.e2e.ts:135,244` (forceStatusRebroadcast); `execution-panel-pause-button.e2e.ts:276`, `pause-resume-emits-lifecycle-event.e2e.ts:138`, `resume-execution-row-runs-again.e2e.ts:116`, `resume-starts-dispatch.e2e.ts:155` (seedPausedAtStatus); `quest-ws-update.e2e.ts:77,149` (patchQuestFlows); `followup.harness.ts:186`, `quest-approved-modal.harness.ts:112` (returns); `quest.harness.ts:1008,1272`; orchestrator `quest-not-found-error.test.ts:29`, `quest-get-planning-notes-responder.test.ts:69`, `quest-get-projection-responder.test.ts:61`, `quest-get-summary-responder.test.ts:87`.
The complete list is `tmp/bigbang/logs/r2-plain.json` filtered by brand; the derivation is: 129 = 107 + 22.

FileMetadataPath 24: `file-base-path-transformer.test.ts:7,15,23,31,39,47,55,63,71,80,88,96,104,112`; `file-base-path-transformer.ts:19`; `path-to-basename-transformer.test.ts:7,15,23,31`; `path-to-basename-transformer.ts:19`; `path-to-relative-transformer.test.ts:8,17,26`; `path-to-relative-transformer.ts:25`.

GuildPath 21: `spawn-batch-layer-broker.test.ts:18,61,86,111,142,162,191,218,245,271,284,326`; `cwd-resolve-broker.test.ts:90`; `guild-path-walk-up-layer-broker.test.ts:24`; `claude-mock.harness.ts:151,152,161,166`; `ward-mock.harness.ts:117,120,133`.

WardResultId 13: `ward-persist-result-broker.test.ts:13,16,26,29,32,45,47,49,60,62,77,82`; `server-init-responder.test.ts:188`.

QuestUpdatedAt 8: `is-quest-update-stale-guard.test.ts:8,9,17,18,26,27,37,45`.
ErrorEntryMessage 7: `result-to-detail-transformer.ts:63,83,96,108,112,134,150`.
QuestBranchName 6: `quest-handle-signal-back-responder.integration.test.ts:104,220,383,481,568,925`.
ClaudeQueueResponseLines 5: `chat-stop-first-message.e2e.ts:124`; `followup-rejection-shown-in-tab.e2e.ts:174,175`; `followup-spawn-failure-surfaces-in-tab.e2e.ts:151,152`.
SourceFacts* 5: `source-facts-extract-statements-layer-broker.ts:35,56,64,67,83`.
AdapterCensusTotals* 6: `adapter-census-totals-transformer.ts:22-27`.
CreatePackageArgs* 3: `create-package-args-parse-transformer.ts:55,88,101`.
GuildUrlSlug 2: `guild-get-broker.ts:28`, `guild-list-broker.ts:29`.
GuildId 2: `guild-not-found-error.test.ts:20`, `dispatch.harness.ts:258`.
QueueMetadataCounter 2: `claude-mock.harness.ts:108`, `ward-mock.harness.ts:86`.
Singles 5: see above.
