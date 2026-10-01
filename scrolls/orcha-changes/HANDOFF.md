# Handoff — the orchestrator step engine chain

**Where the work is:** `worktrees/orchestrator-step-engine`, branch `orchestrator-step-engine`, carved off
`master` at `e2eda6e78`.

**Rule the user set and it does not expire:** master's own changes are never reverted. On any merge conflict
master's side survives and this branch's side adapts around it. No `-X ours`, no `-X theirs`, no rebase, no
force-push.

---

## Done: entries 01–24, every one gated and committed

| # | SHA | What is now true |
|---|---|---|
| 01 | `ef11419a6` | a unit can be marked `met` / `cant-meet` / `unmet` with evidence |
| 02 | `e371eeaf5` | a work item knows its step, assignment, marks and minter |
| 03 | `6d7f0f8ea` | a quest holding a renamed prompt loads instead of failing whole |
| 04 | `e348e6651` | which family runs next is data with routes |
| 05 | `9bf45b956` | what happens inside a family is data with routes |
| 06 | `871aa7cc1` | a graph that cannot work is refused at author time |
| 07 | `ea407e636` | a planner's forecast has a shape |
| 08 | `f7ace524c` | eighteen checks a submitted plan must pass |
| 09 | `8403aca8e` | a plan lands on disk and comes back |
| 10 | `f018e3bdd` | a unit's mark is the one on the most recent work item ASSIGNED it |
| 11 | `0aedfe043` | which units a step is measured over |
| 12 | `b9d06bfcc` | the in-scope set, and what outstanding means |
| 13 | `03b0ff00d` | marks become one of four words |
| 14 | `84aaefe3a` | no session signals with an assigned unit unmarked |
| 15 | `a00e301ad` | the router — four questions in a fixed order |
| 16 | `458e3af92` | scopes minted late, `complete` off the graph |
| 17 | `96de8ef12` | `quest-work`, the write surface |
| 18 | `40937800a` | `get-quest-work`, the one startup call |
| 19 | `023902b20` | `signal-back` stops deciding anything |
| 20 | `32adfa1db` | commit, ward, riftcarver, cleanup as handlers |
| 21 | `85955a55e` | the selector returns a batch |
| 22 | `771f815c9` | advance, start and the fan-out read the graphs |
| 23 | `50c3bc50b` | the router starts and kills siegelense instances |
| 24 | `8aab15203` | the deletions, and the five defects they exposed |

Last full gate: lint 527, typecheck 7743, unit 356 files / 2733 cases, integration 40, e2e 7 — eight packages,
exit 0.

---

## In flight: set 25, the prompts

A set orchestrator planned it and was mid-run when the session ended. **Its plan corrected the set file in four
places** and should be followed over the file:

- **21 sessions, not 18.** Two are new, for the `writeIngredient` decision below.
- **12 registered prompt names, not 11.**
- **SIX directories deleted, not four.** The three operator prompts plus `siegemaster-reviewer/`,
  `siegemaster-verifier/` and `siegemaster-stress/`. The set file's "four, not five" is an arithmetic slip.
- **Registration's blast radius is NINE files, not the three the set file names** — which is why registration is
  split into two sessions (`25q1` deletes and re-points the resolver, `25q2` fixes the downstream tests). **The
  tree cannot compile between them.** That is expected; gate only after the second returns.

**Shape:** four waves. Wave 1 is `25p` (three shared blocks) and `25s` (the `writeIngredient` step). Wave 2 is the
sixteen prompt sessions split 8/9, deliberately, so the second half inherits a corrected exemplar. Wave 3 is the
two registration sessions, serial.

**Check before resuming:** wave 2a may have been dispatched before wave 1's shared blocks landed. If so, those
prompt files import statics that do not exist. `git status` and a scoped ward will show it.

---

## Decisions already made — do not re-open these

| Question | Decision | Why |
|---|---|---|
| all-operational quest: whole-quest off-map item, or `empty`? | **the whole-quest item** | The plan text says `empty`; the shipped code and two independent sessions say otherwise. Off-map probe families are properties of the BUILT SYSTEM, not of any drawn flow, so that one item is a quest's only `hostile-input` and `perf` coverage |
| who writes a hydration ingredient? | **its own step**, `mintableOnRequest`, in flowrider and siegemaster. One request per missing ingredient | a sub-agent is the black box this whole redesign exists to delete |
| the `operational` docs scope | **re-pointed** at that whole-quest item, not deleted | follows from the above |
| `wardMode` | **deleted, no carrier field** | after the cutover there is one ward SCOPE; the committed ward became a STEP inside each family. `role === 'ward'` identifies it uniquely |
| an amendment re-cutting a drained batch | **allowed, no refusal** | the router governs it by piece id — an id still carrying a work item reads as started |
| `outstanding` and the record | **the record qualifier stays** | without it a unit a completed work item marked `met` reads as outstanding forever |
| ward crash (exit 2) | **`wall`** | ward graded nothing, so there is no failing file for a repair to fix |
| `observableOrigins` | **carried verbatim** for now | newly testable since the router has back-edges; revisit |

---

## Owed, and no story in the chain owns any of it

**Due the moment set 25's registration lands:**

1. ~~**Remove the dispatch fallback.**~~ **Done (landed on master):** All twelve prompt names are registered in `agentPromptClassificationStatics.promptNames`. `buildSpawnInstructionLayerBroker` separates the spawned role (`workItem.role`) from the fetched prompt (`taskPrompt`), and the `[dispatch-role]` stderr fallback has been deleted.
2. ~~**Restore the graph check at server boot.**~~ **Done (landed on master):** Restored; `GraphReachabilityBootFlow()` is wired into server startup at `packages/server/src/startup/start-server.ts:31`.
3. **A mint-to-re-mint test for siegelense lane kill-once.** Needs the antagonist prompt (`siege-adversarial-walker`), which set 25 wrote. The mint-to-re-mint integration test remains owed.

**Deletion, decided by the user and not yet done:**

4. ~~**Remove the `invalidation` payload from `quest-work`**, its five carried guards, and the `walk-reset` note.~~ **Done (landed on master):** The `invalidation` payload has been removed from `questWorkInputContract` and `questWorkRecordResultContract` (with tests refusing `kind: 'invalidation'`), and `walk-reset` is retained only as an inert note kind for legacy quest loading.

**Smaller, all confirmed real:**

5. ~~`orch-codeweaver-partial` in `smoketest-scenarios-statics.ts` exercises a continuation that can no longer happen; that file and `slot-manager-statics.ts` still describe `operationStatus: 'partial'` as live.~~ **Done (landed on master):** Scenario removed; `smoketestScenariosStatics` declares only `orchHappyPath` and `orchReachesFlowrider`, and `operationStatus: 'partial'` has been eliminated.
6. ~~The siegelense `walking` / `attacking` docs scope trim — a `@dungeonmaster/siegelense` edit, out of set 25's package.~~ **Done (landed on master):** Landed in `packages/siegelense/src/statics/docs/docs-statics.ts` (commit `6f9798b9a`), clarifying router-owned instance lifecycles vs manual runs.
7. ~~`flowriderScopeSignedOff` and `DEFAULT_FLOWS_FLOWRIDER_SIGNED` in the web test harnesses have no caller left.~~ **Done (landed on master):** Both dead fixtures were removed from `packages/web/test/harnesses/quest/quest.harness.ts`.
8. ~~`CLOSE_OUT.repair` declares no `done` route and the route path sets no minter, so a finished repair there blocks with `no-minter`.~~ **Resolved on master:** DEF-201 confirmed that the fixpoint router stamps `mintedBy` on mark-minted work items and returns to `ward` without blocking with `no-minter`.

**Still genuinely open:**

9. Check 19 — "a walk piece whose path needs a seeded system names a recipe". No definition of "needs a seeded system" exists anywhere, so it is named in the check contract and never emitted.
10. Whether `unitIdContract` and `qaChecklistItemIdContract` merge. Byte-identical validation, separate brands, now paying a re-parse at every boundary between them.

---

## What is left after set 25

| Set | Size | Note |
|---|---|---|
| 26 sign-off retirement | **31 sessions**, measured | serial for one, then parallel. One worker splits the eligibility statics; the other thirty read that result |
| 27 UI | ~7 | serial for two, then parallel. Row identity has a silent failure mode — nothing errors when it is wrong. **Its gates WILL run e2e** |
| 28 independent | ~12 | three unrelated bodies of work, mostly parallel |

Then: iterate `--committed --uncommitted` to green, one bare `npm run ward`, merge into `master` preserving the
user's changes, and stop the supervision timer.

---

## The lesson worth carrying

**e2e ran for the first time at entry 24 and found five defects stacked on each other**, every one of which would
have stopped a real quest dead, and none of which lint, typecheck or a unit test could see: a prompt instructing
an agent to violate a contract; a recovery net whose premise had quietly become false; six more prompts with the
first defect; a signal that completed a whole scope so the step graph never ran; and a dispatch resolving a role
the enum rejects, killing the entire scan.

Twenty-four gates passed while all five were live — not because the gates were weak, but because ward only runs
e2e when an e2e-eligible package changes and nothing touched `web` until then.

**Force an end-to-end run at every set boundary, not just where ward decides to.**

Three sessions reported `blocked` rather than delivering something green, and between them they found the three
deepest defects. That behaviour is wanted, not tolerated.
