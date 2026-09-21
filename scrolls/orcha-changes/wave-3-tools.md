# Wave 3 — the two tools

**Settle these before a word of wave 6 is written.** Nineteen prompts all begin with the same call,
and none of them can be authored until it is fixed what that call returns.

**Model: opus** for 3A, **sonnet** for 3B and 3C.

**Spec:** plan §5 in full, plus §8's "The endpoint gaps" table — that table is the complete list of
what `get-quest-work` must carry, and anything missing from it is a session that cannot do step one.

---

### 3A — `get-quest-work`, the one startup call for every role

```
READ      plan §5 (all of it, including "A prompt carries IDs" and "No session runs git
          at all") · §8 "The endpoint gaps — all three families hit the same wall"
OWNS      a new responder under packages/orchestrator/src/responders/quest/
          its return contract
          a new work-plan-to-text transformer, beside the four that already render
            structures to text for agents
NO TOUCH  packages/orchestrator/src/responders/quest/get-qa-checklist/ — it stays LIVE
          until wave 4 deletes it. Its derivation brokers survive and become this tool's
          internals, so read them, do not move them
          packages/orchestrator/src/brokers/git/working-tree-files/ — REUSE
            gitWorkingTreeFilesBroker, do not write a second git call
DONE      every row of §8's endpoint table is returned, and the two call shapes both work:
          `{ questId, operationItemId }` renders the whole plan; `{ questId, workItemId }`
          returns everything one session needs to start
ASSERT    the typed scope — `flowId`, `packageNames`, `operationItemText` — because all
          three families are dead on their first tool call without it. Then `piece: null`
          explicitly for a planner, since an omitted key reads as a failed fetch and a
          `wall`. Then the markdown renderer, on its rendered TEXT: **an observable
          claimed by no piece must be visible in the output** — in JSON an absence is
          invisible by construction, and that is the defect a planner most needs to see.
          Then the uncommitted list is tracked changes UNIONED with untracked additions —
          a bare diff reports tracked paths only, so the net-new files a worker just wrote
          would be invisible
```

**Two shape questions this session has to answer rather than dodge.** `surface` needs a second source:
filling it from `qaChecklistItemContract.checkSurface` works for observables, but terminals and
labelled edges carry no type tag and appear in no `CHECK SURFACES` row — their sentence is in
`qaCheckSurfaceStatics.byKind`. Read one source only and every terminal's surface fills empty. And
"notes from previous sessions" means two different things: the plan's per-piece `notes` written by a
planner, and `quest.planningNotes.questNotes[]` written by a running session. Plan §9l settles that
both are served and only the second is written by a session.

**Why the git reads move here.** No session but `warpgate` runs git after wave 4, so `git log
--name-only`, `git status` and `git diff HEAD` all become fields on this answer. A session's own `git
log` sees whatever worktree it is standing in; the serving path knows which worktree it means.

---

### 3B — `quest-work`, the write surface

```
READ      plan §5 (the payload table) · §"Bulk invalidation stays, as its own payload"
OWNS      a new responder and its discriminated input contract, six payloads:
          plan · observations · amendment · outcome · invalidation · request
NO TOUCH  the planned-work contract — session 1B owns it, and this CALLS it
          the gate — session 2C owns it, and this ENFORCES it at the tool boundary
DONE      all six payloads round-trip, and a refused write says what is missing rather
          than just saying no
ASSERT    `observations` keyed by `unitId` with `toSettle` required on `cant-meet` and
          refused elsewhere. `outcome` accepted from a step holding NO units and refused
          from one holding some — that is what makes `done` a fact about the record rather
          than a claim. `plan` refused WHOLE on any validation failure. `invalidation`
          keeping the three guards the old broker had: the `walk-reset` note, the
          siegemaster-only authority check, and the in-scope check, each with its own
          error message. `request` minting the named step and returning to the asker
```

---

### 3C — `signal-back` stops deciding anything

```
READ      plan §5 "`signal-back` survives, but stops deciding anything" · §"Which
          invariants break", the commit-before-signal paragraph
OWNS      the signal-back responder and its input contract
NO TOUCH  the gate's own implementation — 2C owns it; this CALLS it
DONE      signal-back keeps redelivery idempotency and the session-terminal marker, gains
          the unmarked-unit refusal, and LOSES the commit-before-signal gate and
          `operationStatus`
ASSERT    a second signal for a terminal work item is a no-op. A signal with an unmarked
          assigned unit is refused **and the refusal names which units**, because the
          session has to act on it inside the same turn. Then the deletion, with the
          reason as its test name: no session commits once `commit` is a deterministic
          step, so every session reaches its signal with a dirty tree by construction —
          keep the gate and a worker that just wrote four files can never signal at all
```

**The commit gate deletion took two passes to get right, so do not re-derive it.** Scoping the gate to
the reviewer was the first answer and it is also wrong: the deterministic `commit` step takes
committing away from the reviewer too, so a reviewer-only gate refuses the reviewer for the same
reason it would have refused the workers. Nobody commits, so nobody can be gated on having committed.
The uncommitted file list survives for its other readers and is SERVED by 3A rather than measured by a
session.
