# 21 — the selector returns a batch

```
GOAL      Dispatch more than one session at a time. It is nearly free.
AFTER     15 (the router decides what the batch IS)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## The whole cap is one line

`nextStepContract`'s `spawn-agents` already carries `agents: z.array(spawnInstructionContract)`, and
`spawnBatchLayerBroker` already spawns the whole array under `Promise.all`, pre-stamping each work item
`in_progress` first.

**The only thing capping dispatch at one session is
`packages/orchestrator/src/brokers/quest/get-next-step/select-batch-layer-broker.ts:17`:**

```ts
const [first] = ready;
```

Parallelism is that selector returning a batch, plus a join: the route fires when the LAST item in the
batch has recorded.

---

## BUILD

| File | Change |
|---|---|
| `select-batch-layer-broker.ts` | return the batch the router decided, not the first ready item |
| `compute-next-step-from-quest-layer-broker.ts` | it already splits a COMMAND work item out to dispatch alone, under its own step type. **Keep that split** — it is what keeps a non-agent role out of `buildSpawnInstructionLayerBroker`'s `agentRoleContract` parse |
| `compute-ready-work-items-layer-broker.ts` | it returns ready items in floor order and excludes pending chat roles. Both behaviours stay |
| the join | a family's or step's route fires when every item in the batch has recorded |

**Concurrent `quest-work` calls queue behind `questWithModifyLockBroker`**, which is what that lock is
for. Story 17 already uses it; assert here that a batch of four writing at once all land.

---

## DONE WHEN

| Assert | |
|---|---|
| a ready set of four dispatches four | |
| the route fires on the LAST recording, not the first | the join. Assert with a fixture where one item records late |
| a COMMAND work item still dispatches ALONE | the existing split. A test that only covers agents will pass against an implementation that batches a ward item with three agents, and that breaks at the role parse |
| a pending chat role is still excluded from the ready set | it is spawned by the route that owns it, never by the dispatcher |
| four concurrent `quest-work` writes all land | the lock |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| bound the batch by instance capacity | story 23 |
| edit `quest-advance-broker` | story 22 |
| change the floor ordering | it is also the web execution view's order. Leave it |
