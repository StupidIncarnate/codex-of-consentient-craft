# Wave 3 — the two tools

**Settle these before a word of wave 6 is written.** Nineteen prompts all begin with the same call, and
none of them can be authored until it is fixed what that call returns.

**Model: opus** for 3A, **sonnet** for 3B and 3C. Dispatch 3A alone and review it closely; 3B and 3C can
go out together once 3A's return shape is settled and written into their briefs.

**This file carries everything a worker needs.** It does not point anywhere else.

---

## Vocabulary, if you have not read waves 1 and 2

**step** one stage inside a family, its own dispatched session · **scope** one family's slice of one
quest, today's `quest.operations[]` item · **work item** one dispatched agent run · **unit** an
observable, a terminal node, a labelled edge, or an off-map family (`offmap:perf`) · **piece** a line in
the planner's forecast file · **the four outcome words** `done` · `unmet` · `empty` · `wall`.

**Three marks a session may write on a unit:** `met` (proved, with evidence), `cant-meet`
(unsettleable at this layer, carries a `toSettle`), `unmet` (not done — the router mints a fresh
session on exactly these).

---

## What the two tools are

One MCP tool every LLM step calls, with a discriminated payload:

| Payload | Sent by | Carries |
|---|---|---|
| `plan` | a planner | the pieces and their batches, plus `plannerMarks` |
| `observations` | any prompt step holding units | per **unit**, one of `met` / `cant-meet` / `unmet`, with evidence. `toSettle` is required on `cant-meet` |
| `amendment` | any step | a change to the plan the run has revealed |
| `outcome` | any step holding no units, and any step hitting a wall | the declared word and its reason — the channel `signal-back` no longer has |
| `invalidation` | a siege fixer, off its `REACHES:` line | a `flowId` and a reason. Every unit on that flow is re-opened and assigned to a fresh session — the bulk lever `reset-flow-signoffs` was |
| `request` | any step | the step it is blocked on — `recipe` or `read` — and why. The router mints that step and returns to the asker, so the asker names no route |

**Keyed by `unitId`, not `observableId`.** A terminal node and a labelled edge are units too, and they
sign on the node and the edge rather than on an observable. The gate's denominator is
the checklist's unit set, now served by `get-quest-work`.

**This record is what the orchestrator reads to pick the next work item.** It does not trust a claim. A
worker that says it is finished while leaving an assigned unit unmarked does not get to signal at all —
the gate refuses before routing is even consulted.

### `get-quest-work` — the plan read back as markdown

A planner that just wrote twenty pieces as JSON cannot see whether they add up, and a plan is expensive
to get wrong — every piece becomes a dispatched session.
`get-quest-work({ questId, operationItemId })` returns it as **markdown**: batches as headings, pieces
as rows, each piece's units listed with what the record already says about them.

Two things it must show that JSON does not make obvious:

- **Coverage** — every observable in scope and which piece claims it. An observable claimed by no piece
  is the defect a planner most needs to see, and in JSON an absence is invisible by construction.
- **Ordering** — the sequence as it will actually execute, not nested `mode` fields the reader has to
  simulate.

This is an existing pattern: `qa-checklist-to-text-transformer`,
`blight-checklist-to-text-transformer`, `flow-graph-to-text-transformer` and
`quest-summary-build-transformer` all already render structures to text for agents. The new
`work-plan-to-text-transformer` sits beside them.

### A prompt carries IDs. Everything else is a call.

**`mcpToolResultStatics.maxVerbatimChars` is 50,000 characters, and today's prompts already run at
43,000–48,000.**
There is no room to inject a piece's files, facts, fences, units and surfaces into a served prompt.
Over the ceiling the MCP layer spills the result to a file and hands the agent an error stub — the
session then holds a path instead of its instructions, and nothing reports a failure.

So `workItemToPromptTransformer` keeps doing exactly what it does today: **substitute the ids and
nothing else.** The agent fetches its own work, the same way it already fetches its flow and its
checklist.

| The prompt is handed | The agent calls for |
|---|---|
| Quest ID, Work Item ID, Operation Item ID, Step ID | its piece — `get-quest-work({ questId, workItemId })` |
| **Instance ID**, on a `needsLane` step only | its flow — `get-quest(…)` |

**The instance id is the fifth substituted value**, and it is there because the ROUTER starts and
stops siegelense instances rather than the walker doing it — that is wave 4's brief 4C. On every other
step it is absent, and a prompt that reads it is a prompt on the wrong step.

`get-quest-work` therefore answers two different questions depending on what it is given:

| Called with | Returns |
|---|---|
| `{ questId, operationItemId }` | the whole plan as markdown — the planner's review-before-signing read |
| `{ questId, workItemId }` | **everything this session needs to start.** See below |

**`get-qa-checklist` is deleted. `get-quest-work` is the one startup call for every role.** One call,
one shape, every family — and because it is one call, three things become possible that were not:

| It returns | Why it has to |
|---|---|
| the typed scope — `flowId`, `packageNames`, `operationItemText` | ids-only leaves no other route to them |
| **the units to cover**, with each one's current mark and the reasoning behind it | this is what `get-qa-checklist` used to give, filtered to this session's assignment |
| **the flows** the scope names, rendered | a walk needs the path, a worker needs the unit text verbatim |
| the piece — `context`, `notes`, and the typed `payload` | `surface`, `layer`, spec path, off-map family |
| **notes from previous sessions on the same work** | a re-mint can read what the session before it found instead of rediscovering it |
| **the uncommitted file list** — `git diff HEAD` unioned with untracked | no session commits now, so nobody discovers the pass by staging it |

**The notes channel is what makes a re-mint cheap.** Work item 2 is minted because work item 1 marked
two units `unmet`. Today a fresh session would re-derive everything. Handing it work item 1's notes on
exactly those units is the difference between a continuation and a restart.

**And it is what lets `signal-back` refuse usefully.** A session trying to signal with units unmarked
gets its own work definition read back at it, with the unfinished units highlighted. The refusal names
what is missing rather than just saying no — which matters, because the session has to act on it
inside the same turn.

**`get-quest-work` returns the uncommitted file list.** Every call, every role.

No session commits any more, so nobody is the one who runs `git status` and sees the whole change set.
The reviewer in particular used to discover its pass by being the session that staged it. That route
is gone, so the call has to hand it over.

**Measure it with `gitWorkingTreeFilesBroker`, which already exists and already gets this right.** It
unions `git diff HEAD --name-only` with `git ls-files --others --exclude-standard`, and the union is
the whole point: a bare diff reports TRACKED paths only, so **the net-new files a worker just wrote —
the ones most likely to carry the defect — would be invisible.** That broker is what today's
commit-before-signal gate measures with, for exactly this reason. The gate goes; the broker stays.
Reuse it rather than writing a second git call that gets it subtly wrong.

Four sessions need it, for four different reasons:

| Who | What they do with it |
|---|---|
| a **reviewer** | it IS the pass. Open every one of those files in full — that is the step that finds a false green |
| a **worker** | see what its siblings in the batch have open, which is the live `DO NOT TOUCH` set the plan could not know at plan time |
| a **fixer** | see what the walk before it left behind — a red test written as evidence is in that list |
| **any session** before signalling | to see what it is handing to the deterministic `commit` step, and to notice a file it did not mean to touch |

**One consequence worth stating:** the list is of the quest's own worktree, not the repo root, and a
quest with no worktree yet returns an empty list rather than an error. A hydrated quest is a real
state, not a violation — the same rule today's commit gate already follows.

#### No session runs git at all. One exception.

Serving the uncommitted list only half-solves this, and leaving the other half made the prompt
inventory contradict itself — several step lists still shelled out to `git log` and `git diff` after
the design had said sessions do not need git.

**So `get-quest-work` serves the git reads too**, and the rule is flat:

| Read | Who wanted it | Now |
|---|---|---|
| `git diff HEAD` + untracked — the pass | both reviewers | the uncommitted list, step 1 |
| `git log --name-only` — what earlier scopes landed | the codeweaver planner, so it does not re-brief work already committed | served: the paths committed on this branch since `baseRef`, grouped by the scope that committed them |
| `git log` — what prior sessions built | `spiritmender`, for context on a red | same field |
| `git status` — is my tree clean | anyone before signalling | the uncommitted list again |

**The exception is `warpgate`, and it is not a loose end.** Driving git IS its job — an intake merge,
a squash onto base, a commit. It is a one-step family with no `commit` step to collide with, and its
own prompt already forbids the two dangerous verbs (never probe for the default branch, never fetch).

Everyone else: **zero git commands, read or write.** That is a cleaner rule than "no git writes",
easier to state in a prompt, and easier to check — a git verb in any prompt but warpgate's is a bug.
It also removes a whole class of failure, because a session's `git log` sees the worktree it happens
to be standing in, and the serving path knows which worktree it means.

**A piece has no size ceiling; a prompt does.** This is the real reason the plan is a file rather than
prompt text, and it is worth saying plainly in the plan contract's own header so nobody later
"simplifies" it back into the prompt.

### Marking as you go — what every worker and reviewer prompt must say

The gate refuses a signal while a unit is unmarked, but a gate cannot make a mark honest or make it
timely. Both are prompt text, and both go in the shared block every non-planner prompt carries.

**Mark each unit the moment you settle it, never in one block at the end.** Two reasons, and the
second is the one that matters:

- A 40-visit step means long sessions are expected. A session that dies having marked nothing loses
  the whole piece; one that marked as it went leaves a partial record its successor can read.
- Marking at the end means transcribing from memory. Today's prompts already fight this — the operator
  is told to sign each group *before* sending the next, precisely so it is not transcribing dozens of
  returns at once (`codeweaver-prompt-statics.ts:437`). Under one session per piece there is nothing
  to transcribe *from*: the session settled the unit itself, so it should write the mark then.

**What each mark costs, stated so nobody guesses:**

| Mark | Write it when | It must carry |
|---|---|---|
| `met` | you settled it and can say how | the evidence — a test `file:line` and the wrong value that turns it red, or the value measured off the running system |
| `cant-meet` | nobody in this role could settle it at this layer | `toSettle` — the action that WOULD settle it, as an instruction |
| `unmet` | real work remains | what is left, and what you already learned. That note reaches your successor |

**Three rules no gate can enforce**, so they are prompt text:

- **`unmet` is not failure and costs nothing.** A session marking its remainder `unmet` and stopping is
  doing the right thing. Pushing on with no context left is what produces a `met` nobody can trust.
- **Never mark a unit you did not settle.** The gate forces a mark on every one; it cannot tell a real
  `met` from a hopeful one. This is the single sentence most worth getting right in every prompt.
- **`toSettle` is an instruction, not a question.** *"Drive a real send through a live quest and read
  the session JSONL for a Read call on the written path"* — never *"how should this be tested?"* A
  question hands the next session something to answer where it needed something to do.

### Sad paths: what a step does when it cannot finish

Every step needs the same three answers, and today they live scattered through five different prompt
sections. Under the step model they are one block, written once and repeated verbatim in every
non-planner prompt.

| Situation | What the agent does | Where it lands |
|---|---|---|
| **Out of scope / out of context** — real work remains that this session will not reach | mark those units `unmet` with a note on what is left, then signal | `quest-work` → `observations`. The router mints part two on exactly those |
| **Cannot be settled at this layer, by anyone in this role** | mark `cant-meet` with `toSettle` — the action that *would* settle it, as an instruction, never a question | same call. The unit is settled; nothing re-opens it |
| **Environment wall** — a denied command, a missing credential, an unreachable service | mark what is markable, then signal `wall` | the quest blocks for a human, carrying the reason |
| **The plan itself is wrong** | `quest-work` → `amendment`, then mark and signal normally | the router re-reads the plan instead of marching down it |
| **The seed is wrong or missing** — the recipes on this work item do not set up the job | request `recipe`, carry on when it returns | the router mints `recipe` and returns it here. Never invent a seed inline |

The three rules no gate can enforce — `unmet` costs nothing, never mark a unit you did not settle,
`toSettle` is an instruction — are stated once under "Marking as you go" above. They belong in the
same shared block as this table, written once and repeated verbatim in every non-planner prompt.

### `signal-back` survives, but stops deciding anything

Two jobs, both load-bearing, neither covered by the write tool:

1. **Idempotency on redelivery** — a second signal for a terminal work item is a no-op.
2. **The session-terminal marker.**

It gains a third: **refusing a signal while an assigned unit is unmarked.**

**And it LOSES the commit-before-signal gate, which the rest of this design makes impossible to
satisfy.** No session commits any more — committing is a deterministic step — so every session
reaches its signal with a dirty tree by construction. Keep the gate and a worker that just wrote four
files can never signal at all; it burns its visits against a wall nothing can move. REL-6d therefore
retires rather than surviving, and the uncommitted file list stays for its other readers: it is the
reviewer's pass, the worker's live `DO NOT TOUCH` set, and the fixer's view of what the walk left
behind. Its `operationStatus` field goes; routing reads the record.

---


---

## The brief for each

Three briefs. 3A first and alone; 3B and 3C together once its return shape is settled.

### 3A — `get-quest-work`, the one startup call for every role

```
OWNS      a new responder under packages/orchestrator/src/responders/quest/
          its return contract
          a new work-plan-to-text transformer, beside the four that already render
            structures to text for agents — qa-checklist-to-text,
            blight-checklist-to-text, flow-graph-to-text, quest-summary-build
NO TOUCH  packages/orchestrator/src/responders/quest/get-qa-checklist/ — it stays LIVE
          until wave 4 deletes it. Its derivation brokers survive and become this tool's
          internals, so READ them, do not move them
          packages/orchestrator/src/brokers/git/working-tree-files/ — REUSE
            gitWorkingTreeFilesBroker, do not write a second git call
DONE      every row of the endpoint table below is returned, and both call shapes work
WARD      npm run ward -- -- <your paths>
```

**A prompt of ids cannot make its first call.** Every step's first substantive call is
`get-quest({ questId, flowId, packageName })`, and both of those values live in the operation item's
TEXT — the line ending `— package: <name> · flow: <id>`. "IDs only" drops that text. All three families
are dead on their first tool call, and the fallback (a whole-quest render) is refused by three separate
prompts as over the 50,000-char ceiling.

**Fix: `get-quest-work({ questId, workItemId })` returns the piece's SCOPE as typed fields** —
`flowId`, `packageNames`, `operationItemText` — for every work item including a planner's. That is one
addition to a return contract rather than a fifth prompt substitution, and it is typed where the text
line never was.

**`get-quest-work` has to carry eight more things, each demanded by a named step.** This is the
complete list; anything missing here is a session that cannot do step one.

| It must return | Who dies without it |
|---|---|
| the step-scoped **in-scope** unit set, beside the **assigned** one | both reviewers and the happy walker. The in-scope gate has no denominator otherwise — and the assigned set is by definition the wrong one, since the whole point is catching a unit no piece claimed |
| the **walk paths** with their force labels and `pathsTruncated` | the siege planner takes them as given; the flowrider planner copies them into `payload.walk`. They lived in the checklist |
| the failing **ward run id and its blob path**, plus the failing check types and file list | `spiritmender`. Its step 1 reads the blob and its step 2 builds a scoped re-run command from it. Both die on "ids only" |
| the **riftcarver `.log` path** when the repair sits in the riftcarver graph | same session, different graph. A carve-only failure produces no ward blob at all |
| **`baseBranch`** and **`worktreePath`** | `warpgate`. Its prompt forbids both alternatives outright — never probe for the default branch, never `git fetch` to refresh it |
| the **minting observation** — the mark and its evidence that caused this session to exist | every fixer. A siege fixer's brief quotes the walker's measured block verbatim, and that block lives on the observation, not on the piece |
| the **uncommitted file list**, tracked changes unioned with untracked additions | both reviewers — it IS the pass. Also every worker, for the live `DO NOT TOUCH` set, and every session before it signals |
| *(covered by the line above)* the live `DO NOT TOUCH` set | falls out of the uncommitted list — a worker sees what its batch-mates have open, which the planner could not know at plan time |
| the piece's **recipes, resolved** — each name with the run id that proved it | both walkers and any browser-layer flowrider worker. A piece names recipe ids; a session needs the names to run and the proving run id to know the seed is not stale |
| the **failing CHECK TYPES**, not just the file list | `spiritmender` builds `--only <checks>` from them, and the blob names one check type per failure. Handed files alone it guesses the check set |
| the running instance's **manifest** — `baseUrl` and every other address — on a `needsLane` step | both walkers. The router started the instance, so the session has no manifest file of its own to read, and a port carried in from anywhere else belongs to some other walk |
| the **baseline**: the happy walk's instance id and run id for the path this piece attacks | the antagonist, and it is the whole reason `happyWalk` routes to `adversarial` rather than sharing a batch with it. Without it the antagonist's absence claim has nothing behind it |
| each unit's **owning node id**, on every unit it returns | the antagonist, which fetches the baseline of the node it is attacking. `qa-checklist-to-text-transformer.ts:237` renders a unit row and interpolates no node, and the walker prompt states the gap in its own words at `siegemaster-verifier-statics.ts:408`: *"Nothing tells you which node an observable hangs on except the flow you read… your brief does not carry it and the checklist does not print it."* The flowrider planner resolves `observableTarget` once into the plan (hole 19); this is the same value, served to every other step so nobody re-derives it |

**And two shape questions it forces:**

- **`surface` needs a second source.** Filling it server-side from `qaChecklistItemContract.checkSurface`
  works for observables. Terminals and labelled edges carry no type tag and appear in no
  `CHECK SURFACES` row — their sentence is in `qaCheckSurfaceStatics.byKind`. Read one source only and
  every terminal's surface fills empty.
- **"Notes from previous sessions" has no defined shape**, and two different things could be meant: the
  plan's per-piece `notes: ["trap: …"]`, or `quest.planningNotes.questNotes[]` keyed
  `{role, workItemId, flowId?, unitId?}`. Pick one, and say whether a worker may write one.


**Two shape questions this brief has to answer rather than dodge**, both stated in the table above:
`surface` needs a second source, and "notes from previous sessions" means two different things. Wave 2
settled the second — a walked note is `quest.planningNotes.questNotes[]` written by a running session,
and the plan's per-piece `notes` are written by a planner. Both are served; only the first is written
by a session.

**What to assert.** The typed scope — `flowId`, `packageNames`, `operationItemText` — because all three
families are dead on their first tool call without it. Then `piece: null` explicitly for a planner,
since an omitted key reads as a failed fetch and a `wall`. Then the markdown renderer, on its rendered
TEXT: **an observable claimed by no piece must be visible in the output** — in JSON an absence is
invisible by construction. Then the uncommitted list is tracked changes UNIONED with untracked
additions, because a bare diff reports tracked paths only and the net-new files a worker just wrote are
most of what a cell produces.

### 3B — `quest-work`, the write surface

```
OWNS      a new responder and its discriminated input contract, six payloads:
          plan · observations · amendment · outcome · invalidation · request
NO TOUCH  the planned-work contract — wave 1 owns it, and this CALLS it
          the gate — wave 2 owns it, and this ENFORCES it at the tool boundary
DONE      all six payloads round-trip, and a refused write says what is missing rather
          than just saying no
WARD      npm run ward -- -- <your paths>
```

**What to assert.** `observations` keyed by `unitId` with `toSettle` required on `cant-meet` and
refused elsewhere. `outcome` accepted from a step holding NO units and refused from one holding some —
that is what makes `done` a fact about the record rather than a claim. `plan` refused WHOLE on any
validation failure. `invalidation` keeping the three guards the old broker had: the `walk-reset` note,
the siegemaster-only authority check (`quest-reset-flow-signoffs-broker.ts:92`) and the in-scope check
(`:101`), each with its own error message. `request` minting the named step and returning to the asker.

### 3C — `signal-back` stops deciding anything

```
OWNS      the signal-back responder and its input contract
NO TOUCH  the gate's own implementation — wave 2 owns it; this CALLS it
DONE      signal-back keeps redelivery idempotency and the session-terminal marker, gains
          the unmarked-unit refusal, and LOSES the commit-before-signal gate and
          `operationStatus`
WARD      npm run ward -- -- <your paths>
```

**What to assert.** A second signal for a terminal work item is a no-op. A signal with an unmarked
assigned unit is refused **and the refusal names which units**, because the session has to act on it
inside the same turn. Then the deletion, with its reason as the test name: no session commits once
`commit` is a deterministic step, so every session reaches its signal with a dirty tree by
construction — keep the gate and a worker that just wrote four files can never signal at all.

**The commit-gate deletion took two passes to get right, so do not re-derive it.** Scoping the gate to
the reviewer was the first answer and it is also wrong: the deterministic `commit` step takes
committing away from the reviewer too, so a reviewer-only gate refuses the reviewer for the same reason
it would have refused the workers. Nobody commits, so nobody can be gated on having committed.
