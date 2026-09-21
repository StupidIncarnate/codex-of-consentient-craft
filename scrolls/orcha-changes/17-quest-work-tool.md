# 17 — `quest-work`, the write surface

```
GOAL      One MCP tool every LLM step calls, with six payloads. This is what routing reads.
AFTER     07 · 08 · 09 · 01
BEFORE    19 · 25
PACKAGE   @dungeonmaster/orchestrator (responder) + @dungeonmaster/mcp (tool)
MODEL     sonnet
```

**After this story lands: `npm run build --workspace=@dungeonmaster/mcp` and reconnect the MCP.** The
MCP stdio child runs compiled output; editing source changes nothing until it is rebuilt. This and
story 18 are the only compiled-output dependency in the whole chain.

---

## The six payloads

| Payload | Sent by | Carries |
|---|---|---|
| `plan` | a planner | the pieces and their batches, plus `plannerMarks` |
| `observations` | any prompt step holding units | per **unit**, one of `met` / `cant-meet` / `unmet`, with evidence. `toSettle` required on `cant-meet` |
| `amendment` | any step | a change to the plan the run has revealed |
| `outcome` | any step holding NO units, and any step hitting a wall | the declared word and its reason — the channel `signal-back` no longer has |
| `invalidation` | a siege fixer, off its `REACHES:` line | a `flowId` and a reason. Every unit on that flow is re-opened — the bulk lever `reset-flow-signoffs` was |
| `request` | any step | the step it is blocked on — `recipe` or `read` — and why. The router mints it and returns to the asker, so the asker names no route |

**Keyed by `unitId`, never `observableId`.** A terminal node and a labelled edge are units too, and
they sign on the node and the edge rather than on an observable.

### A unit id has a SHAPE, and every fixture in stories 17–19 spells it

`qaUnitEnumerateTransformer` is the single enumeration — it says so in its own header at `:10` — and
it mints `<flowId>:<kind>:<localId>`:

| Line | Kind | Form | Example |
|---|---|---|---|
| `:54` | terminal | `` `${flowId}:terminal:${node.id}` `` | `flow-send:terminal:forward-unchanged` |
| `:67` | branch | `` `${flowId}:branch:${edge.id}` `` | `flow-send:branch:copy-failed` |
| `:81` | observable | `` `${flowId}:observable:${observable.id}` `` | `flow-send:observable:scan-finds-every-path` |
| `:97` | off-map | `` `${flowId}:off-map:${family}` `` | `flow-send:off-map:hostile-input` |

**`off-map`, hyphenated, and flow-scoped.** A bare `offmap:<family>` matches nothing: every downstream
join between a mark, a piece's `assignedUnitIds` and the enumerated set is string equality, and an id
that does not round-trip through this transformer is a mark on a unit nobody can find. Stories 18 and
19 use these forms too.

---

## The input contract

**Where it lives:** `packages/orchestrator/src/contracts/quest-work-input/quest-work-input-contract.ts`,
with the colocated `quest-work-input.stub.ts` and `quest-work-input-contract.test.ts` the folder type
requires. It lives in the orchestrator rather than in `shared` because the `plan` payload embeds
`workPlanContract` (story 07, `packages/orchestrator/src/contracts/work-plan/`), and `shared` may not
depend on the orchestrator — `packages/orchestrator/package.json` lists exactly
`@dungeonmaster/config`, `@dungeonmaster/shared`, `zod`.

**The MCP side keeps a second, thinner copy** at
`packages/mcp/src/contracts/quest-work-input/quest-work-input-contract.ts`, whose `plan` and
`amendment` bodies are `z.record(z.unknown())`. That duplication is the existing pattern, not a new
one: `signalBackInputContract` already exists twice, in `packages/mcp/src/contracts/signal-back-input/`
and `packages/server/src/contracts/signal-back-input/`. The MCP copy exists only to be fed to
`zodToJsonSchema` for the advertised schema; the orchestrator copy is the one that validates. The
orchestrator's `@dungeonmaster/orchestrator` package exports only `.`, `./brokers` and `./testing`
(no `./contracts` subpath), so the MCP side cannot import the real one.

### The discriminator is `payload.kind`

Not a top-level `kind`. The envelope carries the routing ids; the union carries the content. Written
flat, `questId` and `workItemId` would sit inside six branches and be six places to get wrong.

```ts
export const questWorkInputContract = z
  .object({
    questId: questIdContract,
    workItemId: questWorkItemIdContract,
    payload: z.discriminatedUnion('kind', [
      planPayload, observationsPayload, amendmentPayload,
      outcomePayload, invalidationPayload, requestPayload,
    ]),
  })
  .strict();
```

`.strict()`, as `signalBackInputContract` and `getQaChecklistInputContract` both are. A key the schema
does not declare is a caller believing it is writing something; silently dropping it is how a mark
goes missing with nothing naming the cause.

### The six branches, with every field

| `kind` | Field | Type | Notes |
|---|---|---|---|
| `plan` | `plan` | `workPlanFieldsContract.omit({ writtenBy: true, writtenAt: true }).superRefine(…)` | story 07's envelope. See "Two fields the caller never sends" and the `.omit()` note below |
| `observations` | `observations` | `z.array(unitObservationFieldsContract.omit({ at: true }).superRefine(…)).min(1)` | story 01's record. `.min(1)` — an empty array is a call that did nothing and should say so through `outcome` |
| `amendment` | `reason` | `z.string().min(1).brand<'AmendmentReason'>()` | what the run revealed. It lands on the plan file's own record |
| | `plan` | the same shape as the `plan` payload's | the WHOLE replacement plan, not a patch — see below |
| `outcome` | `word` | `z.enum(['done', 'unmet', 'empty', 'wall'])` | story 05's four words |
| | `reason` | `z.string().min(1).brand<'OutcomeReason'>()` | required on all four. A `done` with no reason is the claim the record is supposed to replace |
| `invalidation` | `flowId` | `flowIdContract` | |
| | `reason` | `questNoteContract.shape.detail` | the SAME type today's `questResetFlowSignoffsBroker` takes (`reason: QuestNote['detail']`, `quest-reset-flow-signoffs-broker.ts:56`), so the note this writes is the note that lever wrote |
| `request` | `step` | `stepNameContract` | story 02's branded string. Must be `mintableOnRequest: true` in the ASKING work item's own family graph |
| | `reason` | `z.string().min(1).brand<'RequestReason'>()` | why this step is blocked without it. It becomes the minted step's brief |

Every branch also carries its literal `kind`.

### `.omit()` does not exist on a refined contract — two upstream stories owe you a base object

`z.object({ … }).superRefine(…)` returns a **`ZodEffects`**, which in zod 3 (this repo is on
`3.25.76`) has no `.omit`, `.pick`, `.extend` or `.shape`. Both contracts this tool reuses carry a
refinement: story 01's `unitObservationContract` (the `cant-meet` ⇄ `toSettle` rule) and story 07's
`workPlanContract` (the `payload.units[]` 1:1 check). So `unitObservationContract.omit({ at: true })`
does not compile.

The evidence that this is how the repo already works: the only `.shape` read of a contract anywhere in
this tree is `questNoteContract.shape.detail` at
`packages/orchestrator/src/responders/quest/reset-flow-signoffs/quest-reset-flow-signoffs-responder.ts:47`,
and `questNoteContract` carries no refinement. Nothing reaches into `signoffContract`, which does.

**Each of those two stories exports its pre-refinement object beside the refined one** —
`unitObservationFieldsContract` and `workPlanFieldsContract`, the bare `z.object` before
`.superRefine`. This story `.omit()`s from those and re-applies the same refinement. **If the upstream
story landed without them, add the export there rather than re-declaring the fields here** — a second
declaration of the same shape drifts the day one side gains a field.

### Two fields the caller never sends

`writtenBy` and `writtenAt` are `.omit()`ed from both plan-bearing payloads and stamped server-side —
`writtenBy` from the call's own `workItemId`, `writtenAt` from `new Date().toISOString()`.

That is this repo's standing rule, not a new one:
`questInputServerTimestampsTransformer` already replaces every timestamp a `modify-quest` payload
carries, because an LLM has no reliable clock — one audited quest carried 27 sign-offs sharing a
single fabricated timestamp that predated the work. `unitObservationContract.at` is omitted from the
`observations` payload for exactly the same reason.

### An amendment is a whole plan, never a patch

It runs story 08's nineteen checks identically, and is refused whole for the same reason a plan is: a
partially-applied amendment is a coverage hole with no owner. Accepting a patch would need a second
validator that graded a plan nobody had assembled yet.

**OPEN** — whether an amendment may re-cut a batch whose pieces have already DRAINED, and who refuses
it if not. Story 08's checks are written against a plan nobody has run; story 15's router is the only
thing that knows what drained. The design author decides which owns it.

---

## Where the responder lives, and the six hops to reach it

**The responder:** `packages/orchestrator/src/responders/quest/work/quest-work-responder.ts`, exporting
`QuestWorkResponder`, with its `.proxy.ts` and `.test.ts`. The folder-per-verb shape matches every
sibling — `responders/quest/get-qa-checklist/quest-get-qa-checklist-responder.ts`,
`responders/quest/reset-flow-signoffs/quest-reset-flow-signoffs-responder.ts`.

**An MCP tool reaches it through six files, and every one of them already exists for a sibling tool.**
Trace `get-qa-checklist` before writing a line:

| Hop | File | What to add |
|---|---|---|
| 1 | `packages/mcp/src/flows/quest/quest-flow.ts` | a `ToolRegistration` entry in the returned array, plus a `zodToJsonSchema(questWorkInputContract, { $refStrategy: 'none' })` const above it |
| 2 | `packages/mcp/src/responders/quest/handle/quest-work-layer-responder.ts` | a NEW colocated layer responder, registered in the `layerResponders` map at `quest-handle-responder.ts:48-59`. **Not an inline branch** — that function's `complexity` is capped at 50 and sits at the ceiling; a map entry costs nothing |
| 3 | `packages/mcp/src/adapters/orchestrator/quest-work/orchestrator-quest-work-adapter.ts` | wraps `StartOrchestrator.questWork` |
| 4 | `packages/orchestrator/src/startup/start-orchestrator.ts` | a `questWork` method on the `StartOrchestrator` object (`:105`) delegating to `QuestFlow.questWork` |
| 5 | `packages/orchestrator/src/flows/quest/quest-flow.ts` | a `questWork` entry delegating to `QuestWorkResponder`, with its `Params`/`Result` type aliases above |
| 6 | the responder itself | above |

A tool registration is four keys and a handler:

```ts
{
  name: 'quest-work' as never,
  description: '…' as never,
  inputSchema: questWorkSchema as never,
  handler: async ({ args }) => QuestHandleResponder({ tool: 'quest-work' as never, args }),
}
```

The `as never` casts are not optional style — `toolNameContract` and `toolDescriptionContract` are
branded, and every entry in that file already carries them.

## Registering the NAME, and the tail of files that pin the tool list

Add `'quest-work'` to `mcpToolsStatics.tools.names` in
`packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts`. **That one edit reds roughly ten tests,
each pinning the list by full value.** They are not a nuisance; each is a place the tool must be
declared. Expect all of these:

| File | What pins it |
|---|---|
| `packages/shared/src/statics/mcp-tools/mcp-tools-statics.test.ts` | a full-value `toStrictEqual` on the names array |
| `packages/orchestrator/src/statics/smoketest-probe-args/smoketest-probe-args-statics.ts` | its test asserts `Object.keys(probeArgs).sort()` equals the sorted tool names — a missing probe entry is a hard fail |
| `packages/mcp/src/flows/mcp-server/mcp-server-flow.integration.test.ts` | `TOOLS_EXEMPT_FROM_SIZE_CAP` at `:1866`. **`quest-work` belongs in it**: the size-capped set invokes every non-exempt tool with `{}`, and a `.strict()` contract rejects `{}`. That file also holds a per-tool `describe('tools/call with <tool>')` block driving the real stdio server |
| `packages/mcp/src/brokers/settings/permissions-add/settings-permissions-add-broker.test.ts` | seven separate copies of the expected allow-list |
| `packages/mcp/src/flows/install/install-flow.integration.test.ts` | an eighth copy |
| `packages/mcp/src/transformers/mcp-permissions-creator/mcp-permissions-creator-transformer.test.ts` | a ninth, whose test NAME carries the tool count |
| `packages/mcp/src/flows/quest/quest-flow.integration.test.ts` | four parallel hardcoded arrays (names, handler types, descriptions, schema types) that must stay index-aligned, and a test name carrying the registration count |
| `packages/mcp/brokers.ts` · `packages/mcp/testing.ts` · the layer responder's `.proxy.ts` | only if the handler reaches a new broker of its own |

`packages/server/src/statics/dispatcher-mcp-tools/dispatcher-mcp-tools-statics.ts` is **not** on that
list. It names the tools `/dumpster-launch` itself calls for orchestration control, so its chatter
stays out of the chat panel. `quest-work` is called by dispatched agents, not by the dispatcher.

## `.claude/settings.json` is GENERATED — never hand-edit it

`settingsPermissionsAddBroker` writes `permissions.allow[]` from `mcpToolsStatics.tools.names`,
prefixing each with `mcp__dungeonmaster__`. It also **prunes** any `mcp__dungeonmaster__*` row whose
tool is no longer in that list (`settings-permissions-add-broker.ts:98-104`), so a hand-added row for
`quest-work` survives exactly until the next `dungeonmaster init` and a hand-edit that got the name
wrong is silently deleted rather than reported.

In THIS checkout the CLI and the install scripts are the code you just edited, so `init` alone runs
the previous build:

```bash
npm run build
npm link --workspaces
npm run init
```

---

## Four rules the tool enforces, and each has a failure behind it

**Every refusal THROWS from the responder; none returns a `{ success: false }`.** That is the rule
`signal-back` already follows, and its own comment says why
(`quest-handle-signal-back-responder.ts:110-117`): the error rides the awaited MCP path back to the
agent, where it is visible and actionable, instead of being swallowed as a success. Nothing is
persisted on a refusal, so the session fixes what the message names and calls again.

### `toSettle` is required on `cant-meet` and refused elsewhere

Story 01's refinement. Assert it reaches the tool boundary — a contract that refuses and a tool that
strips are indistinguishable until the day a `cant-meet` lands with no instruction and nobody can act
on it.

### `outcome` is accepted from a step holding no units and REFUSED from one holding some

This is what makes `done` a fact about the record rather than a claim. A worker that says `done` while
holding an `unmet` unit is contradicting its own marks.

```
quest-work: work item <id> is assigned 7 unit(s), so its outcome is DERIVED from its marks and
cannot be declared. These units contradict `done`:
  flow-send:observable:scan-finds-every-path
  flow-send:terminal:forward-unchanged
  flow-send:branch:copy-failed
Mark each one through `observations` and signal — the router reads the record. Nothing was recorded.
```

Story 13's `deriveOutcome` is the thing that throws; this tool surfaces it and names the units.

### `plan` is refused WHOLE, never per piece

A partially-accepted plan is a coverage hole with no owner. Story 08 has the nineteen checks; this
tool runs them and returns the error. **The error names the piece id and the check**, because the
planner has to act on it inside the same turn.

```
quest-work: plan refused — 2 of 14 pieces failed validation. Nothing was written.

  pc-3   assigned unit `flow-send:observable:shipping-total` is not in scope for operation item op-7
  pc-9   payload.units[] holds 4 entries for 5 assignedUnitIds — `flow-send:terminal:forward-unchanged` has none

Fix both and resubmit the whole plan in this turn.
```

### `invalidation` keeps the guards the old broker had

Read `packages/orchestrator/src/brokers/quest/reset-flow-signoffs/quest-reset-flow-signoffs-broker.ts`
before writing this. It throws five times, and **every message moves across verbatim** — replace
`reset-flow-signoffs:` with `quest-work:` and change nothing else. A bulk lever with no authority
check is a session able to erase another family's whole flow.

| Line | Guard | The message, verbatim |
|---|---|---|
| `:72` | the work item is on this quest | `` `reset-flow-signoffs: work item ${workItemId} is not on quest ${questId} — nothing was reset` `` |
| `:84` | it has a linked operation item | `` `reset-flow-signoffs: work item ${workItemId} has no linked operation item on quest ${questId}, so it declares no flow scope — nothing was reset` `` |
| `:92` | siegemaster-only authority | `` `reset-flow-signoffs: only a siegemaster work item may reset a walk — work item ${workItemId} is linked to a ${operationItem.role} operation item (${String(operationItem.id)})` `` |
| `:101` | the flow is in the item's own scope | `` `reset-flow-signoffs: flow ${flowId} is outside the scope of work item ${workItemId}, whose operation item ${String(operationItem.id)} covers ${scope} — nothing was reset` `` |
| `:113` | the flow is on the quest | `` `reset-flow-signoffs: flow ${flowId} is not on quest ${questId} — nothing was reset` `` |

The `:101` message interpolates a `scope` that reads `'no flows at all'` when `flowIds` is empty
(`:104-106`). Carry that branch too — `covers ` followed by nothing is the shape of a bug report
nobody can act on.

**The `walk-reset` note requirement moves with them.** `:141-154` numbers each note off the
walk-resets already recorded for that flow (`walk-reset-<flowId>-<n>`), because notes are keyed on id
and upserted, so a second reset of one flow must not collide with the first. `invalidation` writes the
same note, with the same id scheme.

**The siegemaster-only check is the one that changes**, and it must change deliberately: `invalidation`
is sent by a siege FIXER off its `REACHES:` line, and after story 05 that session's work item carries
`step: 'fixHappy'` or `step: 'fixAdversarial'` rather than `role: 'siegemaster'`. Key the authority
check on the work item's FAMILY, not its role — the message wording is unchanged.

---

## Concurrency

Concurrent calls queue behind `questWithModifyLockBroker`
(`packages/orchestrator/src/brokers/quest/with-modify-lock/quest-with-modify-lock-broker.ts`), which is
what that lock is for. **Use it.** Parallel dispatch lands in story 21 and this tool is the thing
several sessions call at once.

```ts
await questWithModifyLockBroker({
  questId,
  run: async (): Promise<QuestWorkResult> => { /* read, mutate, persist */ },
});
```

Two rules off that broker's own header, and each costs a deadlock or a lost update:

- **Never wrap a call to `questModifyBroker` or `questOperationsUpdateBroker` in it.** Both take the
  lock themselves and it is deliberately non-reentrant, so wrapping one deadlocks that questId.
- **A second mutex is not a second lock, it is a lost update.** Two writers that do not queue behind
  THIS one both read the same bytes and both rename the same `quest.json.tmp`.

`questResetFlowSignoffsBroker` is the working example: it bypasses `questModifyBroker` because it is a
whole-subtree read-modify-write rather than an upsert of a caller-supplied patch, takes the public
lock itself, and persists through `questPersistBroker` — whose outbox append is what drives the
WebSocket `quest-modified` broadcast the browser re-renders on. `observations` and `plannerMarks` are
the same shape of write. **Persist through `questPersistBroker`, never `fsWriteFileAdapter`.**

---

## Where each payload lands

| Payload | Written to |
|---|---|
| `plan` · `amendment` | `<questFolder>/planned-work/<operationItemId>.json`, through story 09's write broker |
| `observations` | `quest.workItems[<workItemId>].observations[]` (story 02), replacing this work item's own set |
| `outcome` | `quest.workItems[<workItemId>]` — the declared word and its reason. Story 13 reads it |
| `invalidation` | a `walk-reset` note on `quest.planningNotes.questNotes[]`, plus whatever story 15's router reads to re-open the flow |
| `request` | `quest.workItems[<workItemId>]` — the requested step and its reason, for story 15's question one |

---

## DONE WHEN

| Assert | |
|---|---|
| all six payloads round-trip | |
| a seventh `payload.kind` is REFUSED by the discriminated union | `.strict()` plus the union, exercised |
| `cant-meet` with no `toSettle` is refused AT THE TOOL | not only at the contract |
| a caller-supplied `writtenAt` / `at` is REJECTED, not overwritten | `.omit()`, so the schema refuses the key rather than silently discarding it |
| `outcome` from a unit-holding step is refused, naming the units | assert the string names every contradicting unit id |
| a plan failing one check is refused WHOLE, and the message names the piece and the check | assert the piece id appears in the thrown message |
| `invalidation` from a non-siege family is refused with **the `:92` message verbatim** | do not rewrite that message |
| `invalidation` for a flow outside the item's scope is refused with **the `:101` message verbatim**, including the `'no flows at all'` branch | |
| `request` for a step that is not `mintableOnRequest` is refused | a session cannot conjure an arbitrary step. Today those are `recipe` (flowrider, siegemaster) and `read` (siegemaster) |
| two concurrent `observations` writes both land | the lock. Fire both without awaiting the first, then assert BOTH sets are on their work items |
| every refusal THROWS rather than returning `{ success: false }` | `expect(...).rejects.toThrow(...)`. A returned failure is swallowed as a success by the MCP layer |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| act on any payload | story 15's router reads the record it writes |
| delete `reset-flow-signoffs` | story 24. It stays live until then |
| build the read tool | story 18 |
| touch `signal-back` | story 19 |
| add `quest-work` to `dispatcherMcpToolsStatics` | it is not a dispatcher tool |
