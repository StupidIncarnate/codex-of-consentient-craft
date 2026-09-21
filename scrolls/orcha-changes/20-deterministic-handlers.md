# 20 — the four handlers, and `args`

```
GOAL      A step whose work is running code, not thinking, runs code. Committing,
          warding, carving and sweeping stop being a session's job.
AFTER     05 (the graphs name these handlers) · 13 (the four words they classify into)
BEFORE    22
PACKAGE   @dungeonmaster/orchestrator
MODEL     sonnet
```

---

## `args: string[]` replaces `wardMode`, and it generalises

A deterministic step declares the flags its handler runs with. `['--committed', '--uncommitted']` is
the branch gate; `[]` is the full one. Three things follow that a mode enum could never give:

| | |
|---|---|
| a new ward scope is a CONFIG EDIT | `['--only', 'lint,typecheck']` as a cheap early gate needs no enum member and no broker branch |
| it generalises past ward | `riftcarver` takes `args: []` today and can take flags tomorrow |
| `wardMode` leaves the operation item too | the step carries the args, so the field the registry, the contract, advance and both splices copy around has nothing left to say |

---

## The four handlers

### `ward`

Runs ward with the step's `args`, classifies the exit into one of the four words.

**A 0-file scope is `empty`, not green.** Ward exits 0 without grading a line, and reading that as
green is how a scope silently ships unchecked. Ward itself already says so; classify it honestly.

**No `wall`.** A deterministic step exits green, red or empty. Only the `repair` step it routes to can
wall.

### `commit`

**And it PUSHES.** Today each reviewer ends on a bare `git push`; deleting the reviewer's git takes
that with it, leaving every commit after the carve local and
`get-blight-checklist({ scope: 'unpushed' })` reading `@{upstream}..HEAD` as the whole branch forever.
So: commit, then push — **bare, no `-u`**. Riftcarver already set the upstream at carve, which is
exactly why that push is `-u` and no later one needs to be.

**A handler writes no prose, so the message is DERIVED from the work item:**

```
<family>/<step>: <the scope — package and flow, or just flow>

met       <unit-id> · <unit-id> · …
cant-meet <unit-id> — <its toSettle>
unmet     <unit-id> — <what is left>
work items: <the ids whose observations this commit covers>
```

Strictly more checkable than the prose it replaces — every line is a value off the record rather than a
claim a session made about itself. Where a commit covers no marks at all (a `repair`, warpgate's own
worktree commits), the subject carries the step and the body carries the work item id alone.

**`empty` is a clean tree**: every piece marked `cant-meet`, or a review-only pass. It still routes to
`ward`, because the branch may be red from an earlier scope.

### `riftcarver`

Classifies its existing failure classes without loss. Read `worktreePrepareStepStatics`:

| Today | Becomes |
|---|---|
| `repairable` | `unmet` |
| `git-state` | `wall` |
| permission denied | `wall` |

**This is the ONE deterministic step that can wall**, and mapping `git-state` to `wall` is *more*
correct than today: a git-state red genuinely is a wall, with no worktree to send a repair into.

### `cleanup`

`siegelense cleanup`, at both ends of the siegemaster graph — `sweepIn` and `sweepOut`. The first makes
the first `capacity` reading honest; the last catches what the pass leaked. They are ledger rows, so a
leak is visible rather than inferred.

---

## Why committing moved off sessions at all — three holes, one change

| | |
|---|---|
| **siege has no committer** | its reviewers are the two walkers and both are categorically forbidden to commit. The session that committed siege's pass was `siegemaster-reviewer`, which story 24 deletes |
| **codeweaver has too many** | "the reviewer commits" fixes parallel workers inside one cell and says nothing about parallel CELLS. Nine cells means nine reviewers, one worktree, one `index.lock` |
| **nothing commits after a `repair`, in any family** | including `riftcarver` and `wardFull`, which get no `CLOSE_OUT` and so declare their own `commit` step in story 05's config. Without it a spiritmender's fix reaches `@complete` uncommitted and warpgate's `git merge --squash` drops it |

---

## DONE WHEN

| Assert | |
|---|---|
| each handler is invoked with the step's `args` **VERBATIM** | that is now the ONLY thing between a branch ward and a full one |
| a 0-file ward scope classifies `empty`, not `done` | |
| each `worktreePrepareStepStatics` class maps to its word, permission-denied to `wall` | |
| the commit message is built from the work item's observations | assert the rendered string |
| `commit` pushes, bare, with no `-u` | |
| a commit covering no marks still produces a valid message | the `repair` case |

---

## OUT OF SCOPE

| Do not | It is |
|---|---|
| delete `wardMode` from the operation item | story 24. Add `args` beside it; remove it there |
| wire a handler into dispatch | story 22 |
| start or kill an instance | story 23 |
