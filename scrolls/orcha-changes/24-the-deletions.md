# 24 — remove what the new path replaced

```
GOAL      Nothing references a symbol the step engine replaced, and the tree compiles.
AFTER     22 · 23
BEFORE    25 · 26
PACKAGE   @dungeonmaster/orchestrator + @dungeonmaster/shared + @dungeonmaster/mcp
MODEL     opus — the deletions cross three package boundaries, and the MCP half is a
          documented tail of roughly 29 edits per tool
```

**Merge this with story 26.** This deletes the tools that WRITE the sign-off fields; 26 deletes the
fields. Ship one without the other and the derivation brokers disagree with the record.

---

## OPEN — `wardMode` cannot leave until somebody decides what replaces it

**This is the one thing to settle before writing a line, and it is a chain-ordering bug rather than a
code question.**

`wardMode` is doing a second job nobody wrote down: **it is the only thing on the ledger that tells a
`wardFull` scope from a committed-ward one.** `operation-item-contract.ts:41–43` describes it as
*"Only on role:ward items — which ward invocation the run-ward work item executes"*, and the two seeds
that set it are `quest-type-registry-statics.ts:77` (`'Ward gate (committed files)'`, `wardMode:
'committed'`) and `:99` (`'Ward gate (full monorepo)'`, `wardMode: 'full'`). Delete the field and both
rows read identically.

**The hole is wider than `wardMode`, and that is what makes this a design call.**
`operationItemContract` requires TWO fields the graph has no home for:

| Required on `operationItemContract` | Today it comes from | Under `questFlowStatics` |
|---|---|---|
| `role: workItemRoleContract` (`:28`) — a closed enum | the registry seed's `role` | story 04's family entries carry `fanOutBy` / `locked` / `routes` and **no `role`** |
| `text` (`:29–33`) — `.min(1)` | the registry seed's `text`, which the fan-out then suffixes `— package: <name> · flow: <id>` | **no `text`** either |

So story 16's scope minter loses `role`, `text` AND `wardMode` at once, and it works today only
because `questTypeRegistryStatics` is live until this story deletes it.

**Three ways out, and the third is already refused:**

| | Cost |
|---|---|
| a carrier field on `operationItemContract` replacing `wardMode` — the family key | a contract change in a story meant only to delete. But `workItemRoleContract` is an enum and `wardFull` is not in it, so this is really "widen the enum by one and stamp the family key as `role`" |
| `text` and `role` move onto `questFlowStatics` family entries | the right home, and it closes all three holes at once — but it changes story 04, twenty stories earlier, which may already have run |
| leave `wardMode` alone | **refused.** Story 20's `args` section states the field leaves the operation item, the contract, advance and both splices |

**The conductor decides**, because the fix lands in story 04 or in story 16 rather than here, and
because story 20's claim depends on the answer. **Do not delete `wardMode` until it is answered** — and
when it is, the row below changes with it.

---

## What goes, and what replaces it

| Thing | Fate |
|---|---|
| `get-qa-checklist` — the MCP tool and its responder | **deleted.** `get-quest-work` is the one startup call. **Its derivation brokers SURVIVE** and became story 18's internals — that story's table names them; do not delete those |
| `reset-flow-signoffs` — the MCP tool, its responder and `quest-reset-flow-signoffs-broker` | **deleted.** Absorbed into `quest-work`'s `invalidation` payload, guards and messages carried across in story 17 |
| `roleToPromptTemplateTransformer`, including its `const exhaustiveCheck: never` | **deleted.** Everything resolves through `agentNameToPromptTransformer` |
| `questTypeRegistryStatics` | **deleted**, once every caller reads `questFlowStatics` |
| `wardMode` | **blocked on the OPEN above** |
| `agentPromptClassificationStatics.operatorRoleNames` | **goes.** "Which roles change code" is a step field now — the answer is per step, not per family |
| `isCommandWorkItemRoleGuard` / `workItemRoleStatics.command` | **simplifies.** `spawnerType` asks `step.kind`, not the role |
| `roleToModelStatics` | **superseded for the six families** — the model comes off the step. Survives for chat roles |
| the `pt N` continuation machinery | retires with duplicate-on-partial |

---

## The callers, found by search rather than assumed

### `roleToPromptTemplateTransformer` — ONE non-test caller

`work-item-to-prompt-transformer.ts:160`:

```ts
const template = roleToPromptTemplateTransformer({
  role: agentRoleContract.parse(workItem.role),
});
```

Delete the folder (`transformers/role-to-prompt-template/`, two files) and point that call at
`agentNameToPromptTransformer`. The comment above it at `:157–159` explains the `agentRoleContract.parse`
— it re-brands rather than narrowing, because the guard calls above return plain booleans — and that
reason survives the swap.

**The trap.** The two return byte-identical templates today and agree **only by construction**. The
deleted one is a `switch` over five roles reading five `<role>PromptStatics.prompt.template`
(`:26–41`); the survivor is a table. **Assert the survivor serves every one of the five with the same
text BEFORE deleting** — `codeweaver`, `flowrider`, `siegemaster`, `spiritmender`, `warpgate`. A silent
divergence here is a family served the wrong prompt, and nothing would fail.

**What is lost, and it does NOT move — an earlier draft of this story said it did.** Two different
checks are in play and they do not substitute for each other:

| Check | Over what | Fate |
|---|---|---|
| `const exhaustiveCheck: never` at `role-to-prompt-template-transformer.ts:38` | **`AgentRole`** — a separate five-member enum (`agent-role-contract.ts`) that this epic never opens | dies with the transformer, and it was never about prompt names |
| `} as const satisfies Record<AgentPromptName, unknown>` at `agent-name-to-prompt-transformer.ts:95` | **`AgentPromptName`** | **stops being a check at all** the moment story 03 opens that contract to a branded string. `satisfies Record<string, unknown>` constrains nothing |

So after story 03 and this story, **nothing at compile time catches a prompt name with no row behind
it.** Story 25q's `DONE` condition — resolve every name in `promptNames` and every `prompt:` value in
story 05's `agentFlowStatics` — is the only gate left, which is why story 03 also gives
`agentNameToPromptTransformer` a loud runtime throw naming the missing name.

**Do not read the two checks as one and delete the transformer expecting the other to cover it.**

### `questTypeRegistryStatics` — every caller, and the story's own count was wrong

**There is exactly ONE caller outside `@dungeonmaster/orchestrator`, not four**, and it is one e2e
spec, not four:

| Caller | Lines | What it reads | Treatment |
|---|---|---|---|
| `packages/web/src/flows/home/bughunt-begin-transition.e2e.ts` | `:1`, `:32`, `:34`, `:41`, `:49`, `:183` | `['bug-hunt'].initialWorkItemRole`, and `feature.relayTail` to build `FEATURE_ONLY_ROLES` | **read deliberately** — a seeded relay checked against real data rather than an assumption. Re-point at `questFlowStatics`, do not delete |

**Three callers are INSIDE the orchestrator**, and the story's list missed one of them:

| Caller | Line | What it reads |
|---|---|---|
| `brokers/quest/create/quest-create-broker.ts` | `:37`, `:63` — `const { initialWorkItemRole } = questTypeRegistryStatics[input.questType ?? 'feature'];` | the create-time seed role |
| `responders/chat/start/chat-start-responder.ts` | `:126` and `:165` — both `questTypeRegistryStatics[chatQuestType].initialWorkItemRole` | which chat role to resume, and which to spawn |
| **`brokers/quest/user-add/quest-user-add-broker.ts`** | `:32`, `:53` — the same `initialWorkItemRole` destructure | **missing from the original list.** It is what `chatSpawnBroker` calls to mint the intake work item |

**`initialWorkItemRole` is the ONLY field those three read**, and it is an INTAKE concern with nothing
to do with the family graph. `questFlowStatics` must carry it, or those three lose the answer. Say in
the commit which of the two it landed on.

Four more orchestrator readers are type-level or documentary, and each needs a look rather than a
delete:

| File | Line | What |
|---|---|---|
| `transformers/relay-tail-fan-out/relay-tail-fan-out-transformer.ts` | `:27` `import type`, `:35` `type RegistryEntry = …` | its whole parameter type is derived from the registry. Re-derive from `questFlowStatics` |
| `statics/signoff-track-eligibility/signoff-track-eligibility-statics.ts` | `:74`, `:102` | JSDoc deriving the relay order. Rewrite; story 26 may delete the file |
| `statics/warpgate-operation/warpgate-operation-statics.ts` | `:3` | JSDoc saying warpgate is NOT seeded from the registry. Still true, different noun |
| `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` | `:41`, `:56` | story 22 already replaced this read |

Plus `shared` itself: `statics/quest-type-registry/` (the statics and its test),
`guards/is-chat-work-item-role/is-chat-work-item-role-guard.ts:16` and
`contracts/quest-type/quest-type-contract.ts:12` — the last two are comment references.

**And the tests that pin it**, all of which move or go: `build-relay-graph`'s `.proxy.ts` (`:17`,
`:30–31`, `:45–57` — it mutates `questTypeRegistryStatics.feature` in place and restores it),
`orchestration-start-responder.test.ts` (eight references), `slash-commands-statics.test.ts:174`,
`relay-tail-fan-out-transformer.test.ts` (six), `signoff-outstanding-transformer.test.ts` (three),
`signoff-track-eligibility-statics.test.ts` (three), `chat-start-responder.test.ts:450`.

### `agentPromptClassificationStatics.operatorRoleNames` — ONE non-test caller

`quest-handle-signal-back-responder.ts:79`:

```ts
const OPERATOR_ROLES = agentPromptClassificationStatics.operatorRoleNames;
```

It is the membership half of `CODE_CHANGING_ROLES`, which gates commit-before-signal — and story 19
deletes that gate outright. So this caller disappears with it; check that it has before deleting the
field. The only other reader is `role-to-model-statics.test.ts:6`.

`.minionNames` **nearly empties** rather than going: reviewers and walkers become steps, and
`chaoswhisperer-gap-minion` is the only true minion left.

### `isCommandWorkItemRoleGuard` / `workItemRoleStatics.command` — nine non-test callers

| File | Line | What it decides |
|---|---|---|
| `brokers/quest/advance/quest-advance-broker.ts` | `:73` | `spawnerType` |
| `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` | `:113`, `:160` | the spine-package fallback exclusion, and `spawnerType` |
| `brokers/quest/hydrate/quest-hydrate-broker.ts` | `:134` | `spawnerType` |
| `brokers/quest/get-next-step/compute-next-step-from-quest-layer-broker.ts` | `:34` | the command split |
| `brokers/quest/orchestration-loop/run-chat-layer-broker.ts` | `:48` | refuses a command item on the chat path |
| `transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts` | `:82` | throws *"…are dispatched as commands by the orchestrator, not via get-agent-prompt"* |
| `responders/quest/handle-signal-back/quest-handle-signal-back-responder.ts` | `:272` | a command role never reaches `signal-back` |
| `packages/web/src/widgets/execution-panel/execution-row-layer-widget.tsx` | `:143` | `const isCommandRow = isCommandWorkItemRoleGuard({ role });` — **outside the orchestrator**, and it decides how a row RENDERS |
| `packages/web/test/harnesses/quest/quest.harness.ts` | `:681` | the e2e harness mints `spawnerType` the same way |

**The web widget is the one to be careful with.** Under the step engine "is this a command row" is
`step.kind === 'deterministic'`, and a work item carries `step` (story 02) but the widget would have
to resolve the step's kind out of `agentFlowStatics`. **Story 27 owns the UI.** Either leave the guard
alive for that one caller and note it, or hand 27 the replacement — say which in the commit.

`quest-run-ward-broker.ts:108–109` names the guard in a comment explaining why it uses
`role === 'ward'` INSTEAD; that comment survives the guard.

### `roleToModelStatics` — one production caller plus the table

`transformers/role-to-model/role-to-model-transformer.ts:13`/`:31` wraps it with
`roleToModelStatics satisfies Record<ClaudeSpawnRole, ClaudeModel>`, and
`agent-name-to-prompt-transformer.ts:53`, `:62`, `:71`, `:88`, `:92` read five entries by name rather
than restating literals. **Keep the chat-role entries** — `chaoswhisperer`, `glyphsmith`, `bughunt`,
`tavernkeeper` — they are dispatched by their own routes, not by a step.

### `wardMode` — every reader, so the OPEN can be decided on evidence

| Package | File | Line | What it does |
|---|---|---|---|
| shared | `contracts/ward-mode/ward-mode-contract.ts` | `:27` | the contract. **It `z.preprocess`es the pre-rename value**: quests on disk carry `wardMode: "changed"` |
| shared | `contracts/operation-item/operation-item-contract.ts` | `:41` | the field this story targets |
| shared | `contracts/work-item/work-item-contract.ts` | `:73` | **a second field**, copied by advance |
| shared | `contracts/ward-result/ward-result-contract.ts` | `:18` | **a THIRD, on the ward RESULT record.** Not the same field and not this story's — it records which invocation produced a blob |
| shared | `statics/quest-type-registry/quest-type-registry-statics.ts` | `:77`, `:99`, `:123`, `:134` | the four seeds |
| shared | `transformers/quest-to-text-display/quest-to-text-display-transformer.ts` | `:173`, `:189` | renders `(committed)` after the role in the ledger text |
| shared | `transformers/resolve-ward-floor-name/resolve-ward-floor-name-transformer.ts` | `:34` | `rootWard.wardMode === 'full' ? 'FLOOR BOSS' : 'MINI BOSS'`. **The execution panel's floor name is derived from this field** |
| shared | `transformers/ward-aware-config-index/ward-aware-config-index-transformer.ts` | `:3` | picks the floor entry off the same value |
| orchestrator | `brokers/quest/advance/quest-advance-broker.ts` | `:78` | copies operation → work item |
| orchestrator | `brokers/quest/build-relay-graph/quest-build-relay-graph-broker.ts` | `:128`, `:165` | seeds it, and copies it onto the first work item |
| orchestrator | `brokers/quest/hydrate/quest-hydrate-broker.ts` | `:141–143` | the same copy |
| orchestrator | `brokers/quest/get-next-step/compute-next-step-from-quest-layer-broker.ts` | `:52` | `mode: commandItem.wardMode ?? 'committed'` — story 22 replaced this with `args` |
| orchestrator | `brokers/quest/run-ward/quest-run-ward-broker.ts` | `:176`, `:260`, `:306` | the result record, the red-chain budget filter, the `pt N` seed |
| orchestrator | `responders/quest/handle-signal-back/quest-handle-signal-back-responder.ts` | `:318–320` | the `pt N` copy, which retires with duplicate-on-partial |
| orchestrator | `statics/work-item-context-block/work-item-context-block-statics.ts` | `:19` | the `- wardMode:` label |
| orchestrator | `transformers/work-item-context-block/work-item-context-block-transformer.ts` | `:56–57` | renders it |
| orchestrator | `transformers/work-item-to-prompt/work-item-to-prompt-transformer.ts` | `:148` | spiritmender's `Failed ward result: … (mode: …)` line — reads the WARD RESULT's copy, which survives |
| orchestrator | `contracts/next-step/next-step-contract.ts` | `:17`, `:32` | `mode: wardModeContract` on the `run-ward` variant |
| mcp | `contracts/run-ward-input/run-ward-input-contract.ts` | `:13`, `:20` | the `run-ward` tool's `mode` argument |
| web | `widgets/operations-ledger/operation-row-layer-widget.tsx` | `:104`, `:110` | renders the mode suffix on a ledger row |
| web | `widgets/execution-panel/ward-result-row-layer-widget.tsx` | `:41` | renders the WARD RESULT's copy |

**Three distinct fields share the name**, and only the first is this story's: the operation item's, the
work item's copy of it, and the ward result's record of which invocation ran. **Deleting the third
breaks the execution panel's ward detail row for every quest already on disk.**

**`resolveWardFloorNameTransformer` is the sharp edge.** The web execution view's floor name reads
`wardMode === 'full'` to say FLOOR BOSS. Under the graph, `wardFull` is a family — so the replacement
is the family key, and that is the same answer the OPEN above needs.

---

## Deleting an MCP tool is a documented tail, and the count is the point

`packages/mcp/CLAUDE.md` § "Adding New MCP Tools" spells the ADD out as *"one edit of roughly 29"*.
Removal is the same list in reverse, and **two tools go here**. Work it as a checklist, not from
memory:

| Pin site | `get-qa-checklist` | `reset-flow-signoffs` |
|---|---|---|
| `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts` | `:33` | `:41` |
| its `.test.ts` — a full-value `toStrictEqual` on the names array | `:26` | `:34` |
| `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` — its test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names, so a leftover entry is a hard fail | `:104` | `:144`, and read its `note` at `:147` before deleting — it records WHY the tool is excluded from the MCP suite |
| `packages/mcp/src/flows/quest/quest-flow.ts` — the registration | `:120` + its schema | `:177` + `:59` `resetFlowSignoffsSchema` |
| `packages/mcp/src/responders/quest/handle/quest-handle-responder.ts` — the `layerResponders` map | `:53` | `:55` (+ the `:26` import) |
| the layer responder itself, with `.test` and `.proxy` | `qa-checklist-layer-responder.*` | `reset-flow-signoffs-layer-responder.*` |
| the orchestrator adapter, with `.test` and `.proxy` | `adapters/orchestrator/get-qa-checklist/` | `adapters/orchestrator/reset-flow-signoffs/` |
| the input contract, with `.stub` and `.test` | `contracts/get-qa-checklist-input/` | `contracts/reset-flow-signoffs-input/` |
| `settings-permissions-add-broker.test.ts` — **seven** separate copies of the allow-list | `:37 :114 :195 :277 :360 :441 :524` | `:45 :122 :203 :285 :368 :449 :532` |
| `flows/install/install-flow.integration.test.ts` — the eighth copy | `:77` | `:85` |
| `transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts` — the ninth, and **its test NAME carries the tool count** | `:24` | `:32` |
| `flows/quest/quest-flow.integration.test.ts` — **four parallel hardcoded arrays** that must stay index-aligned, plus a test name carrying the registration count | `:18 :243 :246` | `:25 :147 :150` |
| `flows/mcp-server/mcp-server-flow.integration.test.ts` — the per-tool `describe('tools/call with <tool>')` block, and `TOOLS_EXEMPT_FROM_SIZE_CAP` | 1 ref | `:1513` + 8 more |
| `packages/mcp/brokers.ts`, `packages/mcp/testing.ts`, the responder's own `.proxy.ts` | check each | `quest-handle-responder.proxy.ts` has 6 refs |
| `packages/server/src/statics/dispatcher-mcp-tools/dispatcher-mcp-tools-statics.ts` | neither is listed — confirm, do not assume | |

**`mcpPermissionsCreatorTransformer` derives the permission strings from
`mcpToolsStatics.tools.names`** (`:18`), so the generated `.claude/settings.json` entries follow the
statics automatically. **Do not hand-edit `.claude/settings.json`** — regenerate it with the build →
`npm link --workspaces` → `npm run init` flow the root `CLAUDE.md` gives.

### The orchestrator half of the two tools

| `get-qa-checklist` | `reset-flow-signoffs` |
|---|---|
| `flows/quest/quest-flow.ts:125` `getQaChecklist` | `flows/quest/quest-flow.ts:142` `resetFlowSignoffs` |
| `startup/start-orchestrator.ts:226–235` | `startup/start-orchestrator.ts:256–267` |
| `responders/quest/get-qa-checklist/` (3 files) | `responders/quest/reset-flow-signoffs/` (3 files) |
| **`brokers/quest/get-qa-checklist/` SURVIVES** — story 18's table names it as the entry point it reuses whole | `brokers/quest/reset-flow-signoffs/` (3 files) **goes** |
| `transformers/qa-checklist-to-text/` **loses its last caller here** — its only one is `quest-get-qa-checklist-responder.ts:101`, and story 18 says `get-quest-work` calls it never. Delete it, or say why it stays | `contracts/reset-flow-signoffs-result/` (3 files) goes |

**`session-forensics` reads the qa-checklist chain too** —
`transformers/quest-to-coverage/`, `transformers/coverage-to-text/`, `guards/is-terminal-unit/`,
`guards/is-track-owed-unit/`, `statics/track-denominator/`. It reads the DERIVATION, which survives.
Run its suite and confirm; do not delete into it blind.

---

## Two traps

**`roleToPromptTemplateTransformer` and `agentNameToPromptTransformer` return byte-identical templates
today and agree only by construction.** The section above has the assertion and the five names.

**`invalidation` has FIVE guards, not three**, and story 17 already carries every one with its message
verbatim — see its table under *"`invalidation` keeps the guards the old broker had"*, which cites
`quest-reset-flow-signoffs-broker.ts` at `:72`, `:84`, `:92`, `:101` and `:113`. **Do not re-derive
them here and do not re-word them.** This story's only job on that file is to confirm all five landed
in story 17's `quest-work` path before deleting the broker they came from.

---

## DONE WHEN

| Assert | |
|---|---|
| nothing references a deleted symbol, and the whole repo typechecks | `tsc` is what finds them. `npm run ward -- --committed --uncommitted` is the run |
| **before deleting `roleToPromptTemplateTransformer`**, a test proves `agentNameToPromptTransformer` returns the same text for all five roles | write it, watch it pass, then delete |
| the three orchestrator callers of `questTypeRegistryStatics` read `questFlowStatics`, and the ONE web e2e spec does too | `quest-create-broker`, `chat-start-responder`, `quest-user-add-broker`, `bughunt-begin-transition.e2e` |
| `get-qa-checklist`'s derivation brokers are STILL THERE and still used by `get-quest-work` | the easy over-delete. Story 18's table is the list |
| all FIVE `invalidation` guards still fire, with their original messages | carried, not rewritten. Assert the `:92` and `:101` messages verbatim, including the `'no flows at all'` branch |
| `mcpToolsStatics.tools.names` no longer lists the two, and every one of the nine allow-list copies agrees | the nine are enumerated above; a missed one is one red test |
| `smoketestProbeArgsStatics` has no entry for either | its test compares sorted key sets, so a leftover fails loudly |
| the web execution panel still renders a ward row and a ledger row for a quest already on disk | the three-fields-one-name trap. Drive it in the browser, not from a unit test |
| `session-forensics`' suite is green | it reads the surviving derivation |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete `wardMode` | blocked on the OPEN above. Report it; do not decide it alone |
| delete a sign-off FIELD | story 26, same merge window |
| delete a PROMPT, or fix a prompt's reference to a deleted tool | story 25. `siegemaster-prompt-statics`, `flowrider-prompt-statics`, `flowrider-reviewer-statics`, `siegemaster-reviewer-statics` and `flow-evidence-contract-statics` all name `get-qa-checklist`; that is 25's edit, and the colocated prompt tests will go red here — say so in the commit rather than editing the prose |
| replace `isCommandWorkItemRoleGuard` inside `execution-row-layer-widget.tsx` | story 27 owns the UI. Leave the guard alive for that one caller if 27 has not landed, and say so |
| delete `glyphsmith` | story 28 — independent of all of this |
| hand-edit `.claude/settings.json` | it is generated. Rebuild and re-run `npm run init` |
