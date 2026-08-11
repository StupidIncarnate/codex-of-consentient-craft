# Flowrider coverage track — CLOSED. Handoff to Siegemaster.

**Quest:** `7bc217a1-41e8-40bd-9e25-803d2716b3e8` — Quest git lifecycle: baseRef branching, Followup Chat, and merge-back
**Status:** `in_progress`. All three flowrider operation items are `complete`. The next role is **Siegemaster**, which
holds six pending items, one per flow.

## Where the track stands

`get-qa-checklist({ questId, track: 'flowrider' })` recomputes `remainingItemIds` as **empty across all five runtime
flows**. That is the number the `signal-back` completion gate rebuilds from the quest file, so it is the authoritative
statement, not a tally anyone typed.

| Flow | Units | Remaining |
|---|---|---|
| `quest-start-worktree` | 59 | 0 |
| `quest-agent-cwd` | 31 | 0 |
| `followup-chat` | 65 | 0 |
| `warpgate-merge` | 90 | 0 |
| `quest-resume-worktree` | 32 | 0 |

277 units total; 242 sit in the Flowrider denominator (the other 35 are off-map probe families, which are Siegemaster's
charter and not on this track). Of those 242: **183 `confirmed`, 59 `unconfirmable`, 0 unsigned.**

## The thing that most shapes your walk

**44 of the 59 `unconfirmable` units are on `warpgate-merge`, and they are all live-agent merge behaviour** — conflict
resolution, `ward-exit-code-gates-progress`, `no-merge-after-red-ward`, `nothing-pushed`, `no-stash-used`,
`repo-root-left-on-base`, `base-conflict-resolved-in-place`, and the whole `wm-*` branch family.

That is defensible for a test-authoring role: a Warpgate agent actually merging two checkouts is not something a suite
drives. But the consequence is concrete — **`warpgate-merge` is the thinnest-tested flow on the quest and carries the
heaviest hand-drive burden.** Budget for it accordingly; it is the flow where a green suite proves the least.

The remaining 15 `unconfirmable` are the follow-up dev-server units (`dev-server-runs-in-worktree`,
`dev-server-uses-configured-port`, `dev-server-answers`, `dev-server-not-started-when-unneeded`, terminal
`dev-server-ready`), a few `followup-chat` branch pairs, and three on `quest-start-worktree`
(`start-post-fired`, `quest-running`, `execution-panel-live`).

**One correction to the record on those three.** They were signed `unconfirmable` by an earlier session on the premise
that the e2e guild directory was not a git repo and Start returned `400 No local main or master branch found`. That
premise is stale — the fixture was repaired in `c68519ae`, and `quest-start.e2e.ts` passes. `start-post-fired` was
additionally sitting on a real defect, now fixed (below). Re-check those three rather than trusting their recorded
evidence.

## Read the quest notes before you start

`quest.planningNotes.questNotes` carries three open items this session recorded rather than buried in prose:

1. **`followup-tab-silent-on-post-200-spawn-death`** — the shape between a spawn refusal and a spawn success. A
   follow-up spawn that answers `200` and *then* dies (child exits non-zero, CLI missing, JSONL never written) has no
   error path to the browser at all: the tab shows a spinner over a permanently empty transcript with no reason given.
   Traced, **not** reproduced. If it reproduces it is a NEW observable — this flow's `spawn-error` terminal only covers
   the pre-200 refusal branch, which is now proven.
2. **`refused-followup-spawn-leaves-inflight-tavernkeeper-item`** — observed directly in a `quest-modified` payload. A
   refused spawn leaves a tavernkeeper work item at `in_progress`; nothing rolls it back. Likely benign per
   `tavernkeeper-item-is-inert-when-idle`, but it touches three units signed by *earlier* passes that never saw this
   state. The question to drive: does a second follow-up attempt reuse that item, or mint a second one?
3. **`ward-package-lint-red-no-bare-location-literals`** — `packages/ward` lint is RED with 3 pre-existing violations
   (provenance verified: those files last changed in March, April and May). Does not block you; the `ward full` gate
   will hit it and insert a spiritmender. The note explains why the rule's own suggested remedy is illegal at two of
   the three sites.

## Two production defects this session fixed, so you know what changed under you

- **The dispatcher never restored a drifted worktree branch before spawning.** `RESUME` and startup recovery both did;
  `scan-once-layer-broker` had no `kind === 'worktree'` arm. An agent got the right cwd and the wrong branch, and the
  commits stayed invisible until Warpgate merged less work than the quest reported. Fixed red-first, and the three
  near-identical pasted blocks were **consolidated into one broker** (`worktreeEnsureQuestBranchBroker`) so they cannot
  drift apart again. The probe sits at the dispatch decision point, so an idle poll costs no `git rev-parse` and a live
  agent's worktree is never re-checked-out beneath it.
- **Five quest-action POSTs sent a `{}` body** the spec says they never carry, which had left
  `quest-begin-transition.e2e.ts:107` red on this branch. Start, pause, resume, abandon, merge — all confirmed
  body-ignoring at the route before being changed.

## Conventions worth keeping

- `.e2e.ts` means Playwright **exclusively**, colocated at `packages/web/src/flows/<route>/`. Jest real-git suites are
  `.integration.test.ts`.
- `packages/web/test/harnesses/followup/followup.harness.ts` gained 10 methods this session — `errorMessages()` returns
  the *exact* content string of each ERROR-labelled message inside the FOLLOW-UP tab, which is what settles
  exact-text claims that `transcriptHasText` (a substring filter) cannot.
- **Two e2e specs reusing a hardcoded work item id get the second quest's `chat-output` frames tagged with the FIRST
  quest's `questId`; the browser drops every frame and the transcript stays silently empty.** Symptom is "passes in
  isolation, fails in sequence". Use per-spec unique ids — ~15 specs currently hardcode the same handful.
  **CORRECTION to an earlier draft of this scroll, which named the wrong cache.** The map that actually answers is
  `workItemQuestIdCache` in `packages/server/src/responders/server-init/server-init-responder.ts:516`, consulted at
  ~:587. `questFindByWorkItemIdBroker` has a cache too, but the server only calls down to it on a miss and then caches
  the result itself, so after the first walk both are warm and the broker's copy is read essentially never. Fixing the
  broker would not have moved this symptom at all. Production is immune either way: work item ids are
  `crypto.randomUUID()` with no clone path, so recurrence needs a hand-written fixture.
- Sign-offs are written incrementally, one `modify-quest` per flow. A restatement of an observable and a sign-off on it
  **cannot ride in the same patch** — the allowlist refuses it, correctly. Send them as two calls.
- `flows` is not writable at status `blocked`. If the quest is blocked, no sign-off can be written until the status is
  restored.
