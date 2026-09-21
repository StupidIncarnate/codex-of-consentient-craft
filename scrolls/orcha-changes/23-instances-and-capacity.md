# 23 — the router owns siegelense instances

```
GOAL      How many instances may run is MEASURED, not declared — and the same code that
          reads the number spends it.
AFTER     22
BEFORE    25
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

**Read `scrolls/seigelense/remaining-build-items.md` first.** Siegelense is not finished, and this
story depends on the parts that are.

---

## Capacity is a reading, not a guess

`dungeonmaster siegelense capacity` answers exactly the question: it returns `suggested` — how many
instances this machine can run right now — alongside the `ceiling` it is never above (a policy knob, 3,
at `capacity-statics.ts:26`), a `why` sentence, and the `measured` and `profile` blocks the judgement
came from. With no profile for the spec it answers 2, so the first pair runs and profiles itself.

So a step that needs one declares `needsLane: true` and **no number at all**. Both siege walkers draw
on that one pool — the shared budget two per-step numbers could never express.

---

## And because the router reads capacity, the router SPENDS it

**A reader that does not also spend is a split the two halves drift across.**

| `needsLane: true` means the router | Instead of |
|---|---|
| calls `start` before dispatching the work item, and waits for the manifest | the session running `start` as its own step 2 |
| substitutes the **instance id** into the prompt, beside the quest, work item, operation item and step ids | the session naming its own lane |
| serves the manifest — `baseUrl` and every address — through `get-quest-work` | the session reading a manifest file it started |
| calls `kill` when the work item records, **whatever the outcome** | the session closing the lane last, which a crashed session never reaches |

**Three things this fixes that the session-owned version could not.** A session that dies mid-walk
strands an API server, a Vite server and a browser, and nothing notices — reaping is tied to the work
item RECORDING rather than to a prompt step running. The pool count stops being something two sessions
could believe differently. And `suggested` cannot drift from the number actually started.

**One case needs a route rather than a rule.** The antagonist deliberately breaks its instance. Today
its prompt says restart as `-2`, then `-3`, and record which points ran either side. Under router-owned
instances it cannot restart anything — so **a dead instance is an `unmet` mark carrying the `status`
output and the points not yet driven**, and the router mints the continuation on a fresh instance. Same
behaviour, and the restarts are visible in the ledger instead of buried in one transcript.

**The `operating` docs scope describes the router now**, not a session. It addresses "the session that
opens and closes a pool of instances and assigns tasks to other agents", which is this code. It keeps
the scope and loses its prompt reader; its rules become the router's spec.

---

## Flowrider's browser cap is a DIFFERENT budget

Its walks run under ward's Playwright, not as siegelense instances, so `capacity` cannot see them in
`measured.siegeInstances` and its answer does not bound them. `maxConcurrent: { limit: 4, counts:
'browser-pieces' }` stays on that step — story 15 enforces it.

**Fixers are unbounded in both families.** They touch no lane and no browser.

---

## DONE WHEN

| Assert | |
|---|---|
| `start` ran before dispatching each `needsLane` work item | |
| the instance id reached the RENDERED prompt | not just the return object |
| **`kill` ran when the work item recorded, INCLUDING when it recorded `wall`** | the case a session-owned close could never reach, and the whole reason this moved |
| a batch of lane steps is bounded by `suggested`, not by a constant | |
| flowrider's four browser walks are bounded separately, and siege's pool does not see them | two budgets |
| `sweepIn` and `sweepOut` both appear as work items, first before `plan` and last after `ward` | |
| an all-operational quest that routes `plan → empty` STILL reaches `sweepOut` | the leak case |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| write a walker prompt | story 25 |
| build anything in the siegelense tool itself | `scrolls/seigelense/remaining-build-items.md` |
