# Flowrider coverage-track handoff — quest 7bc217a1 (queue-mergings)

Written at the end of the FOURTH consecutive killed session on the single `flowrider`
operation item. Read this before dispatching anything.

## The one number that matters

`get-qa-checklist({ questId, track: 'flowrider' })` → **241 of 276 units unsigned.**

| flow | unsigned / total |
|---|---|
| quest-start-worktree | 52 / 59 |
| quest-agent-cwd | 24 / 31 |
| followup-chat | 58 / 65 |
| warpgate-merge | 83 / 90 |
| quest-resume-worktree | 24 / 31 |

All 35 off-map probe families are already settled on this track. `init-worktree-scaffold`
is operational and correctly outside the denominator.

`signal-back` **refuses `done`** while that set is non-empty, and it recomputes the set from
the quest file rather than believing a report. No successor can complete this item without
writing the track. It is the whole gate.

## Read this before you dispatch: two failure modes that have now cost four sessions

### 1. A killed session loses 100% of its minions' output

Sessions 1–4 all dispatched parallel minion fleets (8, then 6 authoring, then 5 coverage).
Every one was killed mid-flight and **not one minion returned an artifact**. Authoring
minions keep their work in the working tree, so a kill strands it uncommitted; two sessions'
worth of that was recovered by hand (see commits `08146659`, `c68519ae`).

### 2. Batched sign-off writes are all-or-nothing — this is what killed session 4

The `flowrider-coverage-minion` contract says, correctly, to batch sign-offs into **ONE
`modify-quest` call per flow**, because 45 individual writes mean 45 quest writes, 45 outbox
appends, 45 WebSocket broadcasts and 45 browser refetches.

The cost of that is invisible until a kill: the minion holds every sign-off in its own
context until the very end, so **a minion killed at 90% done writes nothing at all**.
Session 4 dispatched five coverage minions, all five died, and the measured result was
`0 of 241` signed. The batching guidance is right for a session that finishes and wrong for
one that gets killed, and on this quest sessions do not finish.

**Recommendation for session 5:** write sign-offs in **small incremental batches** — per node,
or in groups of ~10 units — accepting the extra quest writes. Partial progress that persists
beats a perfect batch that never lands. Alternatively, sign inline in the operator session
for the flows you can evidence yourself, so the writes go out as you go.

## HAZARD: killed coverage minions leave mutation probes in PRODUCTION source

A `confirmed` verdict requires the auditor to have *watched the test fail*, so it breaks the
production line the test guards, runs the suite, then reverts. **A minion killed between the
break and the revert leaves broken production code on disk.**

Session 4 left two, both severe, both found only because the tree was clean before dispatch:

| file | probe left behind |
|---|---|
| `packages/orchestrator/src/brokers/quest/cwd-resolve/quest-cwd-resolve-broker.ts` | guard inverted, `worktreePath === undefined` → `!== undefined` — flips the worktree/repo-root decision for every quest |
| `packages/server/src/responders/quest/followup/quest-followup-responder.ts` | `mutationProbeAlwaysTrue` short-circuit disabling the entire follow-up status gate, so any quest status could spawn a session |

Both were reverted by editing them back (never by unwinding the tree — this branch is
shared). Build exit 0 and scoped ward green afterwards: 27 files, 662 tests.

**So: before any new work, run `git status` and treat every modified file under `src/` as a
suspected probe until you have read its diff.** Commit before dispatching, so the tree is
clean and a probe is trivially visible as the only diff.

## Verdict discipline the next session must hold

- `confirmed` = a test `file:line` **plus the production line you broke and the assertion
  that reddened**. A green run is not evidence.
- `unconfirmable` = genuinely unreachable, and the contract **refuses it without a
  `question`**.
- A unit that merely needs a test nobody wrote stays **UNSIGNED**. That is a real state and
  it routes work back to an authoring pass. Do not launder it as `unconfirmable`.

### Where false greens will be manufactured if nobody watches

- **~21 `warpgate-merge` units describe what a LIVE agent does to real repositories**
  (`full-ward-runs-after-intake`, `no-merge-after-red-ward`, `nothing-pushed`,
  `repo-root-wip-preserved`, `no-stash-used`, the conflict-resolution units, and the
  `wm-intake-*` / `wm-ward-*` / `wm-base-*` / `wm-root-*` branches). `warpgate-prompt-statics.test.ts`
  is 168 lines that assert the prompt TEXT. Prompt text is documentation-of-record, **not**
  coverage of "`git merge-base --is-ancestor` exits 0". Design decision
  `ward-green-gates-the-merge` says it outright: asserting only that ward was invoked "would
  let a conforming implementation run it, ignore the result, and land a broken branch".
  Expect `unconfirmable` with a question here.
- **Real-git invariants across `quest-start-worktree`, `quest-agent-cwd`,
  `quest-resume-worktree`** (`quest-branch-created-at-base-tip`,
  `workspace-links-resolve-in-worktree`, `edits-land-in-worktree`, `interrupted-edits-survive`,
  `drifted-branch-restored`). Existing tests mock git at the adapter boundary; a test asserting
  "the adapter was called with these args" cannot settle "`git rev-parse X` equals
  `git rev-parse Y`". Check every unit against its `checkSurface`.
- **`packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts`
  is committed, real, and STILL HAS NO CALLER.** A harness nobody invokes proves nothing —
  do not credit it. It is ready-made groundwork for exactly the real-git units above.

### Two files confirmed by hand to be holes, not coverage

- `tavernkeeper-prompt-statics.test.ts` (15 lines) asserts only
  `expect.stringMatching(/^.+$/su)`. It would stay green if the template *were* the glyphsmith
  one — the exact bug `dd-followup-powers` warns about. `tavernkeeper-prompt-is-its-own`
  additionally needs the non-chat-role build to throw.
- `followup-chat-start-flow.integration.test.ts` (37 lines) opens with
  `expect(FollowupChatStartFlow).toStrictEqual(expect.any(Function))` — existence-only.

## Open defects (neither is the coverage track)

1. **Start Quest is broken under Playwright e2e**, taking down 5 pre-existing specs:
   `quest-start.e2e.ts` (2) and `quest-begin-transition.e2e.ts` (3). Measured off the wire:
   `POST /api/quests/<id>/start` → 400 `"No local main or master branch found"`, because Start
   now probes for a local `main`/`master` and the e2e guild dir (`/tmp/dm-e2e-*`) is not a git
   repo. The fix belongs in the **fixture** — give the e2e guild a real repo with a real base
   branch, and check whether `buildCommand` resolved from the fixture's own
   `.dungeonmaster.json` makes synchronous worktree prep affordable. **Do not fix it by
   weakening the base-branch probe**; that certifies the break. Blocks
   `execution-panel-live`, `start-post-fired`, `start-returns-process-id` at their own surface.
2. **The loop-level positive chat-dispatch test cannot be staged.** It failed
   `Quest not found: add-auth`. Root cause: `questGetBroker` / `questModifyBroker` /
   `questCwdResolveBroker` all compose `questFindQuestPathBrokerProxy`, whose pathJoin/readFile
   stand-ins for zero-argument npm calls are **one-shot queues consumed in registration order**,
   not argument-addressed — documented verbatim at `run-chat-layer-broker.proxy.ts:46-54`.
   Two orderings were tried (call-order with the recursive re-read staged, and plain
   call-order); the legacy-vs-worktree branch was ruled out since `QuestStub` carries no
   `worktreePath`. The test was removed rather than left red, because it is a harness-staging
   problem and not a product defect. The behaviour is covered at its own layer by
   `run-chat-layer-broker.test.ts`.

## Suggested order for session 5

1. `git status` → read every `src/` diff as a suspected probe. Revert by editing back.
2. `npm run build` **redirected, not piped** — `npm --workspaces` does not stop at the first
   failing package, so a pipe into `tail` shows vite's success as the last line while the real
   exit code is 2. Confirm exit 0.
3. Take **one flow**, smallest first (`quest-agent-cwd`, 24 units). Sign it incrementally.
   Commit. Then the next. Four sessions have proved that a whole-quest fan-out lands nothing.
