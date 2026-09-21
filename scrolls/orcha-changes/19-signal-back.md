# 19 — `signal-back` stops deciding anything

```
GOAL      Keep two jobs, lose one, gain one.
AFTER     14 (the gate it calls)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**The file is `packages/orchestrator/src/responders/quest/handle-signal-back/quest-handle-signal-back-responder.ts`**,
exporting `QuestHandleSignalBackResponder`. Its three companions are
`quest-handle-signal-back-responder.proxy.ts`, `.test.ts` and `.integration.test.ts` in the same
folder. Every line number in this story is that file as it stands today.

---

## Four changes

| | |
|---|---|
| **KEEPS** idempotency on redelivery | a second signal for a terminal work item is a no-op — `:134-138` |
| **KEEPS** the session-terminal marker | `:222-237`, the `completedAt` / `actualSignal` write |
| **GAINS** the unmarked-unit refusal | story 14's gate, called here |
| **LOSES** the commit-before-signal gate, and `operationStatus` | see below |

---

## Why the commit gate is DELETED, not scoped

**This took two passes to get right. Do not re-derive it.**

The first answer was to scope the gate to the reviewer, because a batch of parallel workers each gated
on a clean tree is a deadlock — measured rather than theoretical: twelve concurrent sub-agent commits
in one worktree, three landed, nine died on `Unable to create index.lock`.

**That is also wrong.** Once `commit` is a deterministic step (story 20), the reviewer does not commit
either. A reviewer-only gate refuses the reviewer for exactly the reason it would have refused the
workers.

**Nobody commits, so nobody can be gated on having committed.** Every session reaches its signal with a
dirty tree by construction. Keep the gate and a worker that just wrote four files can never signal at
all — it burns its visits against a wall nothing can move.

`gitWorkingTreeFilesBroker` — what the gate measured with — **stays**. It is the reviewer's pass, the
worker's live `DO NOT TOUCH` set, and the fixer's view of what the walk left behind. Story 18 serves it
rather than each session running it. **Delete the gate; do not touch
`packages/orchestrator/src/brokers/git/working-tree-files/`.**

### Exactly what to delete

Five contiguous regions, and nothing outside them.

| Lines | What it is |
|---|---|
| `:70-73` | `OUTSTANDING_PREVIEW_LIMIT`. Its comment reads *"How many outstanding unit ids (or dirty paths) to name inline before deferring to the tool that lists the rest."* The unit half moves to story 14's gate, which builds its own refusal message; the dirty-path half goes with the gate. Nothing in this file uses it afterwards |
| `:75-90` | `OPERATOR_ROLES` and `CODE_CHANGING_ROLES`, and with them the `agentPromptClassificationStatics` import at `:67` — this is its only reader in the file |
| `:140-147` | `preGateRef`, `preGateId`, `gatedOperation`. All three exist only to feed the gate; the update callback at `:242-246` resolves the linked operation item again for itself |
| `:149-202` | the gate itself, comment and all |
| `:60`, `:63` | the `gitWorkingTreeFilesBroker` and `questCwdResolveBroker` imports. Each has exactly one call site, both inside `:149-202` |

The two lines to search for, so the region is unmistakable:

```ts
  const resolution =
    gatedOperation !== undefined && CODE_CHANGING_ROLES.has(gatedOperation.role)
      ? await questCwdResolveBroker({ questId })
      : undefined;

  if (resolution?.kind === 'worktree') {
    const dirtyPaths = await gitWorkingTreeFilesBroker({ cwd: resolution.cwd });
```

and the throw it guards, which opens:

```ts
        `signal-back refused: the quest worktree still carries ${String(dirtyPaths.length)} uncommitted change(s), so the work this signal reports is not in history yet and the next session inherits a dirty tree it did not write.`,
```

**The file's own header carries the gate too** — `:23-26`, the paragraph beginning *"On EVERY outcome —
`done`, `partial` and `blocked` alike — a role that changes code is refused…"*. It goes with the code.
Per this repo's comment discipline the replacement states the rule as it stands, in the present tense;
the before/after belongs in this document and nowhere else.

**`packages/orchestrator/CLAUDE.md` documents the gate in two places** — the "Commit-before-signal gate"
block under `## Signal System`, and the paragraph after it beginning *"The gate is satisfied by
construction rather than by the operator's own commit."* Both describe behaviour that no longer exists
once this lands. Rewrite them to what is true after.

---

## Where story 14's gate is called

In the slot the commit gate occupied: **after the idempotency check at `:136`, before the
`questOperationsUpdateBroker` call at `:214`.** Both halves of that placement are load-bearing and both
are already argued in the file.

- **After idempotency**, for the reason `:134-138`'s own comment gives about the commit gate: a
  redelivered signal for an already-terminal work item must not pay a gate's cost, because the first
  delivery already applied the outcome.
- **Before any mutation**, so a refusal leaves the work item and its operation item exactly as they
  were and the session can mark and signal again.

**It THROWS; it does not return a failure.** That is this file's standing rule and its reason is written
at `:110-117`: the error rides the awaited `signal-back` path back through the MCP tool to the agent,
where it is visible and actionable, instead of being swallowed as a success. Story 14 returns
`{ ok: false, unmarked, message }`; this responder throws `message` verbatim. **Do not re-word it** —
story 14 owns that text, including the closing line about `unmet` being free, which is there to stop a
blocked session padding marks to get past the gate.

**The gate's denominator is `workItem.assignedUnitIds`** (story 02), not the work item's
`observations[]`. Story 14 owns that read; this story only has to not defeat it. A fixture here spells
unit ids in the real shape — `<flowId>:<kind>:<localId>`, hyphenated `off-map`, minted only by
`qaUnitEnumerateTransformer`; story 17 has the table. `flow-send:observable:scan-finds-every-path` is a
unit id; `obs-3` is not, and a fixture using one tests a join that never happens in production.

---

## `operationStatus` goes, and this is everything that reads it today

Routing reads the record now. `done` is derived from the marks (story 13), `partial` retires with
duplicate-on-partial, and a `wall` arrives through `quest-work`'s `outcome` payload (story 17) carrying
its own reason — so all three enum members have a replacement and the field has none of its own.

The field is not local. **Six production files pass it and one reads it:**

| Package | File | What it does with it |
|---|---|---|
| mcp | `src/contracts/signal-back-input/signal-back-input-contract.ts` | declares it, `:38-43`, and REFINES on it, `:51-54` |
| mcp | `src/responders/interaction/handle/interaction-handle-responder.ts` | pass-through |
| mcp | `src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | pass-through |
| server | `src/contracts/signal-back-input/signal-back-input-contract.ts` | a SECOND copy of the same declaration and refinement |
| server | `src/responders/quest/signal-back/quest-signal-back-responder.ts` | pass-through |
| server | `src/adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.ts` | pass-through |
| orchestrator | `src/flows/quest/quest-flow.ts:200-215` · `src/startup/start-orchestrator.ts:515-528` | pass-through |
| orchestrator | this responder | **the only reader** — `:104`, `:212`, `:260`, `:289-293` |

**There are two contract copies and both must change**, or the MCP tool advertises a key the server
rejects. That duplication is pre-existing, not something this story introduces.

### `blockedReason` and the refinement

`signalBackInputContract` ends with

```ts
  .refine(
    (input) => input.operationStatus !== 'blocked' || input.blockedReason !== undefined,
    "operationStatus 'blocked' requires blockedReason — the user needs to know what wall to clear",
  );
```

in both copies. **That refinement cannot survive the field and goes with it.** `blockedReason` itself
stays on the contract, unrefined and with no writer left, and story 24 deletes it — the same treatment
the `pt N` machinery gets below.

### What becomes unreachable, and stays anyway

`isEnvironmentWall` (`:212`) and `needsContinuation` (`:260`) both read `operationStatus`. With the
field gone they are constant `false`, so the pt-chain block at `:258-335` — `operationPtChainTransformer`,
the `maxAttempts` ladder, `chainSpent`, the continuation splice — becomes dead code that still compiles.
**Leave it.** Story 24 owns the `pt N` continuation machinery, and deleting it here would put a
cross-package change inside a story scoped to one responder.

The two halt routes at `:339-352` go the same way: `blockedOnSpentPtChain.value` and `isEnvironmentWall`
are both permanently false, so `questBlockOnFailureBroker` is never reached from here.

**Halting moves to the router.** A `wall` is an `outcome` payload (story 17), story 15's `NextAction`
decides to block on it, and story 22 wires that decision into advance. **This story lands BEFORE 22, so
between the two nothing halts a quest on a wall.** That is the chain's own ordering, not a defect
introduced here — but say it in the commit message, because a quest that walls in that window keeps
dispatching.

### What does NOT change

The responder's two remaining status reads stay as they are: `isTerminalWorkItemStatusGuard` at `:136`
and `:218`. **Never replace either with a literal comparison** —
`rule-ban-quest-status-literals-broker.ts:34` refuses it, and `workItemStatusContract` holds six values
(`pending`, `queued`, `in_progress`, `complete`, `failed`, `skipped`), so a hand-written check is also
wrong. Test files are allowlisted by `isStatusComparisonAllowlistedGuard`, so the DONE WHEN assertions
below may name a status directly.

`packages/orchestrator/src/contracts/stream-signal/stream-signal-contract.ts` and the two transformers
that read it — `transformers/signal-extractor/` and `transformers/signal-from-stream/` — keep their
`operationStatus`. They parse what an agent EMITTED into its session stream, not what the tool accepts,
and until story 25 rewrites the five role prompts agents still emit it. The prompt statics
(`codeweaver-prompt`, `flowrider-prompt`, `siegemaster-prompt`, `spiritmender-prompt`,
`warpgate-prompt`) are story 25's, and their colocated tests pin prompt TEXT rather than the contract,
so they stay green through this change.

---

## DONE WHEN

| Assert | |
|---|---|
| a second signal for a terminal work item is a no-op | assert `quest.json` is byte-identical after the second call, not just that it returned success |
| a signal with an unmarked assigned unit is refused, **and the refusal names which units** | the session must act on it in the same turn. Assert every unmarked unit id appears in the thrown message |
| a refused signal leaves the work item `in_progress` and its operation item `pending` | nothing is persisted on a refusal — that is what lets the session mark and call again |
| the gate runs AFTER the idempotency check | a redelivered signal for a terminal item does not invoke story 14's gate at all. Assert the gate proxy recorded zero calls |
| **a signal with a DIRTY TREE succeeds** | the deleted gate. Write this one explicitly, with a fixture holding uncommitted files — it is the regression guard against re-adding it |
| the same dirty-tree case succeeds for a `codeweaver` work item specifically | the gate keyed on `CODE_CHANGING_ROLES`, so a fixture using a chat or command role passes against the gate still being there |
| `operationStatus: 'partial'` is REJECTED by both contract copies | `.strict()`, so an unknown key is a parse error rather than a silent drop. Assert against `packages/mcp/…/signal-back-input-contract.ts` AND `packages/server/…/signal-back-input-contract.ts` |
| `{ signal: 'complete', questId, workItemId }` alone still parses | the surviving shape |
| `blockedReason` with no `operationStatus` parses | the refinement is gone, so it no longer demands a partner |
| `gitWorkingTreeFilesBroker` and its colocated tests are untouched and still green | the easy over-delete. Story 18 is its new caller |

Integration coverage goes in `quest-handle-signal-back-responder.integration.test.ts`, which already
exists and already carries 24 `operationStatus` references — those are the cases to re-cut. Use
`installTestbedCreateBroker` from `@dungeonmaster/testing` for the dirty-tree fixture's temp directory,
under the OS `/tmp`, never inside the repo.

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| implement the gate | story 14. Call it |
| route after a signal | story 15 |
| remove the `pt N` continuation machinery | story 24 |
| delete `blockedReason` from either contract | story 24. Remove its refinement here; the field goes there |
| edit any role prompt that tells an agent to send `operationStatus` | story 25 |
| touch `streamSignalContract` or the two signal transformers | they parse emitted text, not tool input |
| delete `gitWorkingTreeFilesBroker` | story 18 serves what it measures |
