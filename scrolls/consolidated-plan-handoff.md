# Consolidated plan — handoff

Pick up from here. `scrolls/consolidated-plan.md` is the original plan. `scrolls/consolidated-plan-units.md` is the
unit breakdown, verified against the code, with each unit's files and dependencies. This file says where the run
stands, how to keep running it, and what the code turned out to be.

Every command here runs from the worktree root, `worktrees/consolidated-plan`, never from the main checkout.

## Where you are

| | |
|---|---|
| Branch | `consolidated-plan`, carved from `master` at `e20c6b771` |
| Worktree | `worktrees/consolidated-plan` |
| Last commit | see `git log -1`; this session's work is everything after `e85216417` |
| In flight | **NOTHING.** Every agent finished and every result is committed. |

**The next session's job is the FINISH, in this order** (each step is spelled out under "Start here" below):

1. Run the four units that must run alone.
2. Rebuild the whole repo, with nothing else running.
3. Run every e2e spec that is waiting on the web build.
4. Run a full `npm run ward` and make it exit 0.
5. Decide the two open scope questions with the user.

## How to operate — the user's standing instructions

1. **At most FIVE sub-agents at a time.** The user raised the cap from three to five this session.
2. **A heartbeat every 30 minutes.** Use `CronCreate` with `13,43 * * * *` (recurring). Do NOT use `/loop` or
   `ScheduleWakeup`; the user asked for cron. It fires only while the session is idle, and dies with the session.
3. **The operator owns builds and commits. A dispatched agent does neither.** Agents also never run `git add` or
   `git mv`: the git index is shared, and one agent's `git mv` was swept into another unit's commit this session.
   Before every commit, run `git diff --cached --stat` and stage explicit paths, never a whole package another
   agent is still editing.
4. **FIX EVERY PRE-EXISTING FAILURE YOU FIND.** The user's words: *"any pre-existing needs to be fixed... we're
   trying to get to a good state with this slew of changes."* A full `npm run ward` must exit 0. A failure an agent
   reports but leaves standing becomes a unit.
5. **Commit on the branch you are on.** No new branches.
6. The standing agent brief lives at `/tmp/claude-1001/.../scratchpad/standing-rules.md` for this session only.
   Recreate it: the bans (no build, commit, add, mv, stash, bare ward, npm install); the fence; discover is stale,
   so locate with it and then Read; the MCP rule tools before the first write; the mutation clause below; and a fixed
   report shape (CHANGED, with one verbatim line each; MUTATIONS; WARD; LEFT STANDING; DECISIONS).

### The mutation clause — put it in every brief

> Prove your tests bite, and treat a mutation that PASSES as a finding. After they pass, break the code
> deliberately and confirm a test goes red. If a mutation passes you have found a MISSING TEST: write it,
> re-run green, re-apply the mutation, confirm red. Report which test caught which mutation.

This session it found about a dozen missing tests, including a quest-id filter that let every quest's broadcast
through, a row-expansion list that was never asserted, and a planner prompt that could drop the piece name silently.

## Owner decisions — settled, do not re-litigate

1. **`workItem.observations[]` IS the sign-off record.** Marks are `met` / `cant-meet` / `unmet`. The old
   `signoffContract`, `signoffTrackContract`, `signoffTracksStatics` and `signoffVerdictContract` retire (T1-15a/b).
2. **The execution panel renders REAL step names**, nested: one row per scope, with indented step rows labelled
   bare / `step` / `step - pieceName` / `step pt: N`. The owner will tweak it after seeing it run.
3. **`verifyByHuman` is a bare optional boolean on a flow OBSERVABLE only.** Any role may set it. The enforcement is
   the filter: a flagged observable resolves to `'human-check'` and drops out of every list.
4. **The `recording` hydration route is deleted.** Done.
5. **Five `docs` scopes; bare `docs` returns the overview.** Done.
6. **The `glyphsmith` role is removed entirely** (added this session). Done.
7. **The `explore_design`, `review_design` and `design_approved` quest statuses are deleted** (added this
   session). Done, along with the design sandbox they served.

## What this session landed

About 70 commits. By track:

| Area | State |
|---|---|
| Track 1 — sign-off re-homing | Done except **T1-15a/b**, the barrel deletion of the four retiring contracts (runs alone). session-forensics computes real per-track marks from work items. The raccoon e2e asserts the four-count rows and seeds real marks. |
| Track 2 — execution panel | Done in code except **T2-9a/b** (dependency labels, auto-expand and scroll, role colour; see the units file). Built: the projection (contract, transformer, HTTP endpoint, web binding), four-tier nested row labels, piece names carried from the plan, the back-edge badge, the unmet list, the unit-marks readout, the scope churn view, the SPEC-tab recipe callout, and `partially_complete` retired. **None of it has been seen in a browser yet**; see "e2e owed". |
| Track 3 — independent work | Done: glyphsmith gone (role, chat, prompts, design prefix); the `verifyByHuman` filter at all three sites; the prompt block in intake, workers, walkers and fixers; the human-verdict note, write path, summary section and verdict panel. |
| Track 4 — siegelense and hydration | Done except **T4-13a** (lockfile) and **T4-15a** (the `locationsStatics` move) and the follow-ons **T4-15b/c/d/h** that depend on it. |
| Web e2e lint debt (D1–D9) | Done. `packages/web` lints clean as a whole package; all 39 direct-I/O errors are gone. |
| Role-path coverage (T5) | Done. Every family's step routes have behavioural integration tests in `quest-route-scope-broker.integration.test.ts`. |

## Production bugs found and fixed this session

Each was found by a test or a docs pass, not by a user.

| Bug | Fix |
|---|---|
| A red family `ward` blocked the whole quest with `no-minter` instead of repairing: `ward` mints with no units, so the repair it routed to carried no `mintedBy` to return to | `ba5f48c5e`: a plain route mint into a step with no `done` route records `mintedBy` |
| A siege walk that folded `empty` blocked the quest the same way | `25117331e`: `happyWalk` and `adversarial` route `empty` onward |
| Siege fixer prompts told the session to mark through `modify-quest` | `5a50bb28b` |
| Reviewer prompts told a top-level `review` step that its "parent" signals and that it should `git commit` and `git push` itself | `37618a33f` |
| Every step ran on its family's model; the per-step `model` in `agentFlowStatics` was never read | `bd05d9e85` |
| The `design-start` responder wrote a status that no longer exists | `4a5ce02fa`: the design sandbox is deleted |
| `promptNames` listed two prompt names with no prompt behind them | `866494f6a`, plus a test that fails on any such name |
| Five orchestrator summary tests went red when the `human-verdict` note kind landed, and stayed red for several commits | `975a69d14`. Lesson: after a `shared` contract change, run the unit tests of every dependent package before committing. |

## Traps — each one measured this session

### Workspace packages resolve to `dist` in three places that are not obvious

- **`server` and `mcp` typecheck `@dungeonmaster/orchestrator`'s ROOT export against its built `dist`.** Under this
  repo's `moduleResolution: node`, a bare `@dungeonmaster/orchestrator` import reads `package.json`'s `types`, never
  the `source` condition. A new `StartOrchestrator` method, or a widened type, is invisible to server's typecheck
  until `npm run build --workspace=@dungeonmaster/orchestrator` runs. `shared`'s subpath barrels are unaffected,
  because their `.ts` files sit at the package root.
- **The Playwright test process resolves workspace packages (`shared`, `hydration-recipes`) to `dist`.** Harness
  code imports them, so an e2e run never sees a source edit to those packages until they are rebuilt. A mutation to
  `hydration-recipes` source passed an e2e run for this reason.
- **Playwright serves the BUILT web bundle.** A widget change is invisible to e2e until `packages/web` is rebuilt.

### Never edit `agent-flow-statics.ts` while an e2e run is in flight

The server validates that graph at boot (`graph-reachability-check-responder`). A mid-edit or a mutation test on it
crashed other agents' e2e runs this session. Mutate the router or a test's seeded state instead.

### Package-scoped ward runs do not evaluate the open-handle gate

A package-scoped run puts unit and integration on the parallel worker pool, which always reports zero open handles.
Only an explicit file list, or `--committed` / `--uncommitted`, takes the in-band path that detects a leak. The
earlier handoff said the opposite.

### A file-scoped ward run can report typecheck PASS on a broken package

A file orphaned from the files you passed is never pulled into the tsc program. Grade a package with
`npm run ward -- --only lint,typecheck,unit -- packages/<name>`.

### MCP dispatch cannot run a deterministic step

`/dumpster-launch` has no tool that runs `commit`, `ward`, `carve`, `repair` or `cleanup` on a current quest;
`run-ward` and `run-riftcarver` are legacy fallbacks. Those steps run under the Node dispatcher only. The smoketest
playbooks now say so.

### A dispatched agent's own sub-agent can redo its whole job

Twice this session, an agent that forked a helper "just to read the rules" got back a helper that had implemented
the entire unit alongside it. Both agents verified the helper's work and kept one copy. Tell agents not to fork
helpers for their core task.

### Small traps

- `.parse()` of an object literal is invisible to the compiler; the summary contracts are `.strict()` for that reason.
- Compare paths WITH the separator, after resolving both sides (`/tmp/dm-home-evil` passes `startsWith('/tmp/dm-home')`).
- A test waiting one microtask for a stray refetch passes a broken filter; the refetch lands a macrotask later.
- `errors/` may import nothing, so an error class types a route union inline rather than importing the contract.
- `enforce-test-colocation` requires a test file to carry its implementation's exact name, so every family's route
  coverage lives in the one broker-named integration file.

## Start here

### 1. The four units that must run alone

Run each with nothing else in flight, one at a time. Full breakdowns are in `scrolls/consolidated-plan-units.md`.

| Unit | What | Why alone |
|---|---|---|
| **T1-15a** | Delete `signoffContract`, `signoffTrackContract`, `signoffVerdictContract` and their `shared/contracts.ts` lines; fix `quest-summary-unconfirmable-contract.ts`, their live consumer | A `shared` barrel edit breaks every package while inconsistent |
| **T1-15b** | Delete `signoffTracksStatics` and `signoffTrackMarks`; rename `signoffDenominatorTrackContract` and `questSummaryLimitsStatics.maxUnconfirmable`. ALSO: the dead `DEFAULT_FLOWS_FLOWRIDER_SIGNED` / `flowriderScopeSignedOff` fixture in `packages/web/test/harnesses/quest/quest.harness.ts`, and the orchestrator test fixtures that still build `codeweaverSignoff` / `flowriderSignoff` / `siegemasterSignoff` (`quest-signoff-coupled-edit-violations`, `quest-signoff-unknown-unit-violations`, `signoff-element-stamp` and others) | Same |
| **T4-13a** | `npm install` to regenerate `package-lock.json` and clear the stale `siegelense-recipes` entry | Rewrites `node_modules` under every running process |
| **T4-15a** | Split the flat `.siegelense` literal in `packages/shared/src/statics/locations/locations-statics.ts` into a `.dungeonmaster-assets` dirname plus the link name; then `npm run build --workspace=@dungeonmaster/shared` | ESLint's own rules import `locationsStatics` from `dist` |

Then T4-15b/c/d/h (siegelense install responders, path broker, CLAUDE.md and `.gitignore`, and the stub fixtures),
which can run in parallel. The `.gitignore` trap: ignore only the `siegelense-assets` child, never the
`.dungeonmaster-assets` parent, because the oddities file there is committed. The oddities brokers (`7c5ab8f7c`)
take their path from the caller, so they need no edit when the root moves.

### 2. Rebuild the whole repo

With NOTHING running: `npm run build`. Then confirm `npm run ward -- --only typecheck -- packages/server packages/mcp`
is green. `mcp` was red on stale `dist` types at the end of this session: `orchestrator-get-quest-work-adapter.test.ts`
and `get-quest-work-layer-responder.proxy.ts` hit `TS2719` on `QuestNote.workItemId`.

### 3. Run the e2e owed

Everything below was written or changed against source that Playwright could not see. Run them after the build,
at most three runs at once, never the whole suite in one command:

| Spec | Owed because |
|---|---|
| `flows/quest-chat/quest-summary-human-check-verdict.e2e.ts` | NEW, never run |
| `flows/quest-chat/flow-diagram-interaction.e2e.ts` | New recipe-callout case, never run |
| `flows/quest-chat/spec-panel-edit-mode-removed.e2e.ts` | Failed on stale `shared/dist` statuses; should pass after the build |
| The ~15 specs asserting execution-row text (listed under T2-1 in the units file) | The row labels changed to the nested four-tier form |
| `quest-replay-subagent-row-isolation.e2e.ts` | One count assertion was updated blind |
| Every `elapsed-duration-*` and `subagent-duration-*` spec, `execution-panel-active-row-collapse`, `execution-panel-paused-row-expandable` | The execution row widget changed shape |

New e2e coverage is also owed, with no spec yet: the back-edge badge (a codeweaver `ward` red → `repair` → fresh
`ward`), the unmet list and unit-marks readout on a real rework, the scope churn line, and the step-based progress
counter.

### 4. Run a full `npm run ward` and make it exit 0

Give it `timeout: 600000`. Only then is anything done. Every package has been graded package-scoped this session,
but never all together, and never after the final build.

### 5. Two open scope questions for the user

1. **Nothing records a `.webm`.** `prune-statics.ts:39-41` marks the video step NOT STARTED. A `verifyByHuman`
   criterion shows "no recording" in the verdict panel, and a person judges without evidence. Building the recorder
   was never in any track.
2. **A held screencast releases passively.** A verdict note makes it releasable, but nothing triggers the release;
   siegelense's next `cleanup` or `prune` pass re-reads `quest.json` and lets it go. Ask whether that is enough.

## Known gaps, not yet units

- **quest-completed recipe** seeds work items with no `relatedDataItems` link to their operations. Nothing in
  hydration-recipes can read an id another seed step created (the missing `attach({id})` verb).
- **Guild delete through the framework** calls the removal broker in-process, never the HTTP route, so it skips
  `StartOrchestrator.removeGuild`'s queue sweep.
- **The verdict buttons' in-flight disable** has no test: `EndpointControl` in `packages/testing` cannot hold a
  mocked request open.
- **`instance-start-broker.proxy.ts`** clears `DUNGEONMASTER_HOME` only as a side effect of another proxy's
  constructor. It works today, but it is fragile.
- **`dumpster-create-prompt`** is about 60 KB. Other prompts are held to 50 KB, but it is served as a slash-command
  body, not through `get-agent-prompt`, so no test caps it.
- **`questSummaryObservableContract.addedBy`** carries a description written for mid-quest observables, and
  `humanChecks` reuses the contract.
- **`smoketest-orchastrator.md`** mentions a "Phase 0" that has no section.
- **The smoketest playbooks' deterministic-step checkpoints** need the Node dispatcher; see the trap above.
- **`nextActionTransformer`** still indexes `agentFlowStatics` with loosely typed parameters, where the projection
  transformers use `routedGraphContract`. A consistency pass, not a bug.

## Last units of this session

The user stopped new dispatches here. These five were in flight; each landed and is committed.

- **Reviewer prompts — `37618a33f`.** The codeweaver and flowrider reviewer prompts now describe a top-level
  `review` step: read the scope through `get-quest-work`, mark every unit through `quest-work`, call `signal-back`
  itself, and leave committing to the `commit` step. **Still stale, and it is served text:**
  `flow-evidence-contract-statics.ts` `judgingMarkdown` (interpolated into flowrider-reviewer) still names
  `get-qa-checklist`, a "parent", and the three-track sign-off shape. Its header names a deleted
  `flowriderPromptStatics`. `standards-review-concerns-statics.ts` says three reviewer prompts interpolate it; there
  are two. `agent-role-contract.test.ts:103-107` and `agent-git-permissions-statics.ts:43-47` still name
  `siegemaster-reviewer`, which is gone. These are the next prompt-fix unit.
- **Comment sweep.** Fixed the `operatorRoleNames`, operation-item and quest-summary-observable comments and the
  playbook's phantom Phase 0. Two findings for the next session:
  - **`pt N` is NOT dead everywhere.** `operation-pt-chain-transformer.ts` is live on the LEGACY path:
    `quest-run-riftcarver-broker`, `quest-run-ward-broker`, `quest-handle-signal-back-responder` and
    `mint-next-action-transformer` call it for a work item with no step node. Its comments are accurate. Only the
    step graph dropped pt-N. Decide with the user whether the legacy path itself should go.
  - **The sign-off retirement is half done in code, not just in docs.** `signoffPatchFieldsStatics.signoffFields` is
    `[]`, and no flow contract carries a sign-off field, but `textDisplaySymbolsStatics.signoffTrackMarks`,
    `quest-input-server-timestamps-transformer.ts:58-61` (it still recurses to stamp sign-offs through a no-op),
    `quest-contract.ts:164,179` (`.describe()` naming the three sign-off fields), `signoff-contract.ts`,
    `signoff-track-contract.ts`, `qa-checklist-kind-contract.ts:11`, and a dozen orchestrator test fixtures building
    `codeweaverSignoff` / `flowriderSignoff` / `siegemasterSignoff` all remain. Fold all of it into T1-15a/b.
- **Design leftovers — `9b8da8bda`.** `designPort`, `needsDesign`, the design-scaffold path broker and
  `locationsStatics.designDir` are gone. An old quest.json carrying either field still loads, because `questContract`
  is not `.strict()`. **This touched `locationsStatics`**, which this repo's own ESLint rules read from `shared/dist`,
  so lint cannot be trusted until the rebuild in step 2 of "Start here".
- **T2-4.** The status bar counts `N/M STEPS` from the projection, clamped to 1, and falls back to the ledger's
  `N/M OPERATIONS` while the projection loads or errors. Scope headers receive their work items, so the churn line
  renders. Track 2's code is complete except **T2-9a/b** (dependency labels keyed on session identity, auto-expand and
  scroll, role colour keyed on step), which is the last link of the execution-row chain and is not started.
- **Step models — `bd05d9e85`.** A step now spawns on the model `agentFlowStatics` declares for it, and
  `get-agent-prompt` reports the same one. The `/dumpster-launch` slash-command body tells the session to pass
  `model: agent.model` on every Task call. **That body is written into `.claude/commands/` by `dungeonmaster init`**,
  so an installed copy is stale until init reruns (in this checkout: `npm run build`, `npm link --workspaces`,
  `npm run init`). Orchestrator passed lint, typecheck, unit and integration as a whole package after this commit.
  Also found: tests in `agent-prompt-get-broker.test.ts` and `agent-prompt-flow.integration.test.ts` named for the
  "operation-context relay path" build a work item with no `step`, so they exercise the MINION branch instead.
  Their titles mislead.
