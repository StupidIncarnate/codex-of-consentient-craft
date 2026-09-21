# Wave 8 — the independent work

**Start this now, beside anything.** Nothing here waits on the step engine, and nothing in the step
engine waits on it. Six of these are single-session and small.

**Model: sonnet**, throughout.

---

## 8A — delete `glyphsmith`

```
OWNS      packages/orchestrator/src/statics/glyphsmith-prompt/   — 3,721 bytes
          the design-chat-start responder
          web's design-session broker
          roughly 35 non-test source files naming the role — most are list entries
NO TOUCH  the design STAGE, and `design_approved`
DONE      the role, its prompt and the chat path that launches it are gone; the stage works
ASSERT    `design_approved` was always set by a HUMAN rather than by that session, so the
          stage loses nothing it depended on. Assert the stage still advances with no
          glyphsmith anywhere
```

Scope measured: about 35 non-test source files name it, and only two are more than a list entry —
`design-chat-start-responder` and web's `design-session-broker`. It is independent of the step engine
entirely, so it can land in any order.

---

## 8B — six defects, each its own small session

```
```

| Defect | Where | Fix |
|---|---|---|
| `riftcarver` missing from the floor list, so it sorts last on a depth tie | `packages/shared/src/statics/execution-floor-config/` | add its entry — that list is also the dispatcher's sort tiebreak |
| `orchestrationPhaseContract` is dead: a stale closed role enum, no consumer | `orchestrator/src/contracts/orchestration-phase/` | delete it, its stub and its test |
| `dagTopologicalSortTransformer` + `dagReadyNodesProcessTransformer` are dead | `orchestrator/src/transformers/` | delete both. The live path is `computeWorkItemDepthsTransformer` |
| `slotManagerStatics` JSDoc names a `slotCount` key that does not exist | `orchestrator/src/statics/slot-manager/` | correct it. Wave 2 replaces the budgets with `maxVisits`, so coordinate that one line |
| `orchestrator/CLAUDE.md:634` is stale on concurrent browser walks | vs `flowrider-prompt-statics.ts:354` | **settled**: `packages/ward/CLAUDE.md:430` says several e2e runs against one package DO run at once, and `:436` gives each its own `.ward-playwright-report-<serverPort>.json`. The collision that line cites no longer exists |
| codeweaver's brief template promises a `MIRROR` block it never defines | `codeweaver-prompt-statics.ts:644`, `:647` | make it a real field or drop the references. Flowrider's map has one, so this is likely an omission |

**One correction already made, kept here so nobody re-derives it.** `devServer.devCommand` is NOT
unread — `tavernkeeper-prompt-statics.ts:86` reads it, to start the dev server when a question needs
the running app. A SESSION reads it, not code, which is exactly why a grep for readers missed it.
Deleting it on that evidence would have broken a prompt. Still apparently unread:
`orchestration.timeoutMs`, `devServer.readinessPath`, `.readinessTimeoutMs` — **and each now needs a
prompt-text check before anyone removes it.**

---

## 8C — `verifyByHuman`, the whole vertical slice

**One pass or not at all.** Half of it leaves an unclosable unit visible to a session that will invent
a mark for it. Roughly four sessions, coordinated, and they are listed together because they merge
together.

```
```

| | Session owns | Note |
|---|---|---|
| **8C-1** | `verifyByHuman: true` on `flowObservableContract`, beside `verifyByReading` at `flow-observable-contract.ts:76` | the flag itself. Nothing else can start first |
| **8C-2** | the human-check value in the step's declared scope | **schedule AFTER wave 5.** It is one more value in `verificationMethods`, the field wave 5 re-keys from track onto step. Land it before and you write it twice |
| **8C-3** | the shared "can anything automate this?" block, and the filter | the block is interpolated into ChaosWhisperer's prompt AND both walkers' from ONE source — copy the `standards-review-concerns-statics` pattern. The filter drops these units from every work-item view once the quest is `in_progress` |
| **8C-4** | the fourth citation kind, the end-of-quest list, and the `(human-check)` panel | the panel needs **a control that takes the person's verdict**. A list a person can read and cannot tick is a list nobody works |

**Why the filter is stronger than just dropping the unit from a denominator.** A session that can SEE
a unit it cannot close does not skip it. It reaches for the nearest thing it can measure — a proxy
assertion, a change-detector, a `toSettle` naming an action nobody will take — and now the quest
carries a test pinning the wrong thing plus a session that spent a pass on it.

**The citation kind cannot wait for a later pass.** A `verifyByHuman` unit hands a person a `.webm` and
a question, and that list reaches them at quest END — so a screencast deleted on the two-day video
retention window is a link that rots before the only reader it has.

**One open question blocks 8C-1.** Is author-only enforcement prompt text, or a real mechanism? The
existing rule for `verifyByReading` is prompt text only — `packages/orchestrator/CLAUDE.md:851` states
it and `dumpster-create-prompt-statics.ts:158` instructs the session, with no guard and no contract
refinement behind either. Matching that precedent is cheap; enforcing it properly is new machinery.
**Decide which, and if it is the second, apply it to BOTH flags.**

**Motion quality is what this route exists for**, and `siegemaster-verifier-statics.ts:321` still asks
for it: "a transition jumps or flickers", listed beside truncation and overlap, which ARE measurable.
A model cannot grade animation — four frames 1.5 seconds apart cannot tell a clean 300ms transition
from a janky one, and every comparison capture is frozen with `animations: 'disabled'` precisely so
`pixelChange` is not noise. Cut it from the walker and route it here.

---

## 8D — the hydration tail

```
OWNS      every hydration recipe that fabricates a work item
DONE      each fabricated work item carries a `step` and its units
ASSERT    a fabricated work item with no `step` is UNDISPATCHABLE — assert the refusal,
          not just that the field is present
```

Small, mechanical, and easy to forget until a smoketest fails for a reason nobody can read. It needs
wave 1's contract, so it is the one part of wave 8 that waits.
