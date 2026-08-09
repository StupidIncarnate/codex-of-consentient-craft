# Flowrider coverage-track handoff — quest 7bc217a1 (queue-mergings)

Rewritten at the end of session 5 (`pt 3`), the first session on this operation item that was not
killed. Read this before dispatching anything.

## The one number that matters

`get-qa-checklist({ questId, track: 'flowrider' })` → **18 of 242 units unsigned.**

Sessions 1–4 left it at 241 of 276 unsigned, measured at **0 signed on every runtime flow**.

| flow | unsigned / in-scope | confirmed | unconfirmable |
|---|---|---|---|
| quest-start-worktree | 2 / 52 | 47 | 3 |
| quest-agent-cwd | 3 / 24 | 21 | 0 |
| followup-chat | 7 / 58 | 39 | 12 |
| warpgate-merge | 3 / 83 | 36 | 44 |
| quest-resume-worktree | 3 / 25 | 22 | 0 |

`signal-back` refuses `done` while any unit is unsigned, and it recomputes from the quest file
rather than believing a report. Both verdicts clear the gate; it refuses ABSENCE, not honesty.

## What unblocked this, and what you must not undo

**Write sign-offs INCREMENTALLY. This is the whole reason the track moved.**

The `flowrider-coverage-minion` contract says to batch sign-offs into ONE `modify-quest` call per
flow. It is right about the cost it avoids (45 writes = 45 quest writes, outbox appends, WS
broadcasts, browser refetches) and it is catastrophic on this quest: the minion holds every
sign-off in context until the end, so **a minion killed at 90% writes nothing at all**. Session 4
dispatched five and measured 0 of 241.

Every brief in session 5 overrode it: `modify-quest` every ~5 units, and settle ONE unit first then
re-read the checklist to prove the write path persists before spending a budget on it. Keep doing
that until the contract itself is changed.

## The 18 that remain — ALL need an AUTHORING pass, not a coverage pass

There is no cheap coverage yield left. Every one of these is "no honest test exists yet", which is
why they are UNSIGNED rather than `unconfirmable`. Do not launder them.

**Real gaps found by probes that stayed GREEN** (this is how a false green announces itself — both
are single-instance fixtures):
- `followup-chat:main-composer-ignores-tavernkeeper-session` — `resolve-chat-quest-layer-broker.ts:99`
  (`wi.role === role`) loosened to `|| wi.role === 'tavernkeeper'` left the WHOLE suite green,
  because every fixture seeds exactly one work item. Needs a two-item fixture with the tavernkeeper
  item listed FIRST.
- `warpgate-merge:warpgate-item-depends-on-nothing` — breaking `dependsOn` to chain off
  `current.workItems[0]` left every test green, because every fixture uses `workItems: []`. Needs a
  quest carrying a prior completed work item.

**A REAL PRODUCT DEFECT, measured and awaiting a product decision:**
- `quest-resume-worktree:dispatcher-trigger-skips-branch-restore` — the dispatcher's own resume
  trigger never restores a drifted worktree branch. `scan-once-layer-broker.ts:59-64` handles
  `kind==='missing-worktree'` but has no `kind==='worktree'` arm calling `worktreeResumeRestoreBroker`,
  unlike `orchestration-resume-responder.ts:114-127` and `recover-guild-layer-responder.ts:113-126`.
  If the dispatcher (queue play button / get-next-step poll) is next to touch a quest whose worktree
  sits on another branch, the next agent gets the right cwd and the WRONG branch; commits land off
  the quest branch and surface only when Warpgate merges less work than the quest reported.
  NOT fixed: mirroring the other two call sites verbatim fires a git probe per active quest per poll
  iteration, so placement is a cost-vs-correctness call for the user. See the questNote of the same
  name. The observable was RESTATED to the positive expectation — it was first filed with the DEFECT
  as its text, which would have let a later pass "confirm" the broken behaviour.

**Layer mismatch, needs a decision or a test at the right layer:**
- `quest-start-worktree:name-taken-leaves-existing-branch` — the committed real-git test drives
  `worktreePrepareBroker` and relies on git's own "branch already exists" refusal, landing in
  `WorktreePrepareError` (the `fail-worktree` path). The flow's own P6 branch rejects in
  `PrepareQuestWorktreeLayerResponder`'s pre-check, which never calls `git worktree add` and raises
  `QuestBranchNameTakenError`. Different code paths. Either author a test driving the real pre-check
  (needs a guild+quest under a controlled `DUNGEONMASTER_HOME` via `orchestrationQuestHarness`), or
  make an explicit call that git-layer defence-in-depth is accepted proof.

**Need e2e/browser authoring** (`followup-chat`): `spawn-failure-surfaces-in-tab`,
`reply-streams-into-tab`, `streaming-works-on-complete-quest`, `streaming-works-on-merged-quest`,
`transcript-replays-after-reload` (needs a real `page.reload()` through the replay broker — a tab
switch keeps the component mounted and is a materially weaker claim), `followup-rejection-shown-in-tab`.

**Need a server-side or ward-package test**: `warpgate-merge:merging-appears-in-queue` (the filter is
server-side in the `/api/quests/queue` handler; `useQuestQueueBinding` does no client filtering),
`warpgate-merge:worktree-survives-merge`, `quest-agent-cwd:ward-scoped` +
`ward-diff-scoped-to-branch` (live in `packages/ward`; `git-diff-files-broker.test.ts` mocks the
spawn adapter exclusively, so no test proves the worktree-vs-repo-root diff distinction),
`quest-start-worktree:bad-status-leaves-quest`, `quest-agent-cwd:qac-present` (the scan broker has a
resilient fallback producing identical output either way, so a single-line break does not redden it),
`quest-resume-worktree:resume-triggers-all-three` (disproven — see the defect above),
`quest-resume-worktree:resumed-quest-progresses`.

## The real-git layer now EXISTS — build on it, do not rebuild it

`packages/orchestrator/test/harnesses/git-worktree-fixture/git-worktree-fixture.harness.ts` was
committed and **callerless for four sessions**. It now has three callers:

- `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.integration.test.ts`
- `packages/orchestrator/src/adapters/git/worktree-add/git-worktree-add-adapter.integration.test.ts`
- `packages/orchestrator/src/brokers/worktree/resume-restore/worktree-resume-restore-broker.integration.test.ts`

They settle 17 units with real SHAs, real `git status --porcelain`, and real `fs.realpathSync` on
the symlinks. Two harness lessons worth keeping:
- `initRepoWithPackages` writes and commits a `.gitignore` (`worktrees/`, `node_modules`, `dist`,
  `.build-pass-count`). Without it a "clean checkout" assertion is not vacuous — it is always false,
  because build artifacts show up as `??` entries.
- `gitStatusPorcelain` `.trim()`s, which strips the leading blank index-column character: a modified
  unstaged file reads `'M README.md'`, NOT `' M README.md'`.

These are Jest, so they are `.integration.test.ts`. **`e2e` means Playwright exclusively**; never
name a Jest suite `.e2e.ts`.

## Do NOT buy green here — the 44 warpgate `unconfirmable`s are correct

~21 `warpgate-merge` units describe what a LIVE AGENT does to real repositories
(`full-ward-runs-after-intake`, `nothing-pushed`, `no-stash-used`, `no-fetch-performed`,
`repo-root-wip-preserved`, `work-visible-on-base`, and the `wm-intake-*` / `wm-ward-*` / `wm-base-*`
/ `wm-root-*` branches). `warpgate-prompt-statics.test.ts` is ~168 lines asserting the prompt TEXT.
**Prompt text is documentation-of-record, not coverage** of "`git merge-base --is-ancestor` exits 0".
Design decision `ward-green-gates-the-merge` says it outright: asserting only that ward was invoked
"would let a conforming implementation run it, ignore the result, and land a broken branch". A
session that converts these to `confirmed` on prompt-text evidence has made the quest worse.

## HAZARD: mutation probes in PRODUCTION source

A `confirmed` verdict requires watching the test fail, so the auditor breaks a production line, runs
the suite, and reverts. **A minion killed between the break and the revert leaves broken production
code on disk.** Session 4 left two — an inverted worktree guard in `quest-cwd-resolve-broker.ts` and
a `mutationProbeAlwaysTrue` short-circuit disabling the entire follow-up status gate.

Session 5 made ~35 probes across seven minions and left ZERO behind. What worked, put in every brief:
- ONE file at a time; break, run the scoped test, **revert by editing back immediately**, confirm,
  then move on. Never leave a probe in place while reading something else.
- Give each concurrently-running minion a DISJOINT probe-path list, so a probe cannot corrupt a
  sibling's test run and manufacture a false `confirmed`. Tell them: if a red appears your own probe
  cannot explain, assume a sibling and re-run before concluding.
- Commit before dispatching, so the tree is clean and a probe is trivially visible as the only diff.
- The operator checks `git status --porcelain` after EVERY wave.

Note: the coverage-minion role prompt forbids running `git` for any purpose, so minions verify their
own reverts by re-Reading. The OPERATOR must do the `git status` check — do not delegate it.

## Verdict discipline — two failure modes that cost real rework this session

- `confirmed` = a test `file:line` **plus the production line you broke and the assertion that
  reddened**, witnessed. A green run is not evidence, and an adjective never is.
- `unconfirmable` = **nobody** could settle it by any test anyone could write, and it REQUIRES a
  `question`. It is NOT a parking space for "the file was outside the probe list my parent gave me"
  or "I could not get ward to run". Both happened this session — 16 units on one flow and 6 on
  another — and all had to be rejected and redone. If your brief is too tight, say so; do not launder
  it into the ledger.
- A unit that merely needs a test nobody has written stays **UNSIGNED**. That is a real state and it
  is what routes work back to an authoring pass.

## Distrust "the environment is broken"

A minion reported `npm run ward` as completely non-functional — "an environment wall, not a work
item" — and signed 16 units `unconfirmable` on that premise. The operator ran the exact command
shape and got `WARD_EXIT=0, PASS 1 files, 491 discovered (2.8s)`. It was a session-local invocation
glitch. **Verify every environment claim yourself before you let it into a verdict.**

What actually works: a single plain command, foreground, `timeout: 600000`, explicit FILE paths, no
redirection, no shell operators, no `cd`, never a bare directory:
`npm run ward -- --only unit -- <file> <file>`
Genuinely broken: `npm run ward -- detail <runId>` (the PreToolUse hook rejects it). To read a real
failure diff, parse `.ward/run-<runId>.json` off disk with `json.JSONDecoder().raw_decode` — it has
trailing non-JSON log lines.

## Open defect, unchanged and NOT the coverage track

**Start Quest is red under Playwright e2e**, taking down `quest-start.e2e.ts` (2) and
`quest-begin-transition.e2e.ts` (3). Measured off the wire: `POST /api/quests/<id>/start` → 400
`"No local main or master branch found"`, because Start probes for a local `main`/`master` and the
e2e guild dir (`/tmp/dm-e2e-*`) is not a git repo. The fix belongs in the **fixture** — give the e2e
guild a real repo with a real base branch, and check whether `buildCommand` from the fixture's own
`.dungeonmaster.json` makes synchronous worktree prep affordable. **Do not fix it by weakening the
base-branch probe**; that certifies the break. It is what keeps `start-post-fired`,
`start-returns-process-id` and `execution-panel-live` `unconfirmable` at their own surface.

## Suggested order for session 6

1. `git status` → the tree should be clean. Treat any modified `src/` file as a suspected probe.
2. `npm run build` **redirected, not piped** (`npm --workspaces` does not stop at the first failing
   package, so a pipe into `tail` shows vite's success while the real exit code is 2). Confirm exit 0.
3. Dispatch **authoring** minions, not coverage ones — there is no coverage yield left. The two
   single-instance-fixture gaps are the cheapest real wins; the six `followup-chat` browser units are
   the largest block and share one Playwright harness.
4. Then ONE coverage minion to grade whatever authoring produced. An authoring minion never signs its
   own work.
5. Put the `dispatcher-trigger-skips-branch-restore` defect in front of the user — it is a silent
   wrong-branch-commit bug and it needs a placement decision, not a test.
