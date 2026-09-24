# Walkthrough ledger

The driver keeps this file current. `README.md` says how.

## Cursor

| | |
|---|---|
| Feature | `features/01-siegelense.md` |
| Next case | Re-run `SL-001` and `SL-002` against the DEF-26 fix, then `SL-004`. Open question for the user: should init's `npm install` for a fresh recipes package move to the end of the install run (DEF-36 row) |
| Rebuild owed | Check at session start. See README, step 3 |

## Feature progress

| Feature doc | State |
|---|---|
| `01-siegelense.md` | Phase 0 (SL-001 to SL-043) walked before the consolidated plan landed. The cases marked `pass (earlier session)` may be worth one re-run. Phase 1 is next |
| `02-hydration-and-recipes.md` | Not started |
| `03-orchestrator-step-engine.md` | Not started |
| `04-marks-and-human-verdicts.md` | Not started |
| `05-web-execution-panel.md` | Not started |
| `06-session-forensics.md` | Not started |
| `07-ward.md` | Not started |
| `08-init-prompts-and-mcp.md` | Not started |

## Defects

Status values:

| Status | Meaning |
|---|---|
| `dispatched` | A sub-agent is working on it this session |
| `queued` | Waiting, for the reason named in the cell |
| `needs decision` | The user must choose before anyone fixes it |
| `fixed, not built` | The source fix landed. The CLI shows it only after a build |
| `fixed` | Landed and reachable. The SHA is in the cell when it was committed |
| `interrupted — re-dispatch` | Its sub-agent died with a session. Check for partial edits first |
| `won't fix` | The user decided so. The reason is in the cell |

Next free number: **DEF-37**. It starts there because commits and older scrolls already use DEF-01 to DEF-25
for a siegelense walkthrough that finished before this one.

| # | Feature · case | Defect | Status |
|---|---|---|---|
| DEF-26 | SL · SL-002 | `docs --for walking` prints the whole `## About` overview above the walking page. The user asks whether the overview belongs inside a role page at all | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-27 | SL · SL-002 | The `### STOPON AND EXPECT` section is unclear. It never says `--stop-on` is a flag on `run`, or that `expect: error` is a field on a step object | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-28 | SL · SL-002 | After reading the walking page, the user still does not know how to use the tool. It has no start-to-finish sequence: `start` to get an instance id, `run --instance <id> --steps '[...]'`, `results`, `kill`. It lists step shapes without the command that carries them | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-29 | SL · SL-002 | The page says "There are ten available actions", then describes `until` straight after. The step contract has more verbs than ten | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-30 | SL · SL-002 | The example blocks are fenced as `json` but are not valid JSON, for example `{ step: 'goto', path: '...' }`. An agent that copies one into `--steps` gets a parse error | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-31 | SL · SL-002 | Only the orchestrator's siege-* prompts tell an agent about siegelense. No session snippet names it, and `get-architecture` does not either. The user wants every session, inside the orchestrator or not, to get a short rundown of the tool, why to use it, and where its docs are | `fixed` — merge `094059dc6`, built, init re-run (`f9b8439f8`). One fix covers DEF-26 to DEF-31 |
| DEF-32 | SL · SL-002 | siegelense only works in this checkout. Its two lane specs, `dungeonmaster-stack` and `dungeonmaster-api`, boot dungeonmaster's own server (`readyPath: '/api/guilds'`). They also need fake Claude and ward CLIs that ship only in this repo's test folders. A consumer has no way to describe their own app. The user says it is meant to work in every repo. Evidence: `packages/siegelense/src/statics/lane-spec/lane-spec-statics.ts:19-22,39-54`, `lane-spec-find-broker.ts:17-27` | `fixed` — merges `75c7b85a6`, `aa6e457fe`, `63ca7485b`, `6d4a437b8`, `64a8f54ba`. Built, and the driver booted a real `start --spec stack` lane from the main checkout: `goto /` and `look` rendered the NEW GUILD screen, `kill` closed both ports. The siegelense integration tests now write their own `.dungeonmaster.json` into a temp dir, and pass |
| DEF-33 | SL · SL-002 | `dungeonmaster init` does not set up a consumer repo so that each siegelense run can boot the app on its own ports. The user runs dungeonmaster on several repos with the same setup | `fixed` for the config half — merge `75c7b85a6`. Runs pass their ports through `env` tokens such as `"PORT": "{apiPort}"`. The siegelense half landed with DEF-32 Piece 2 |
| DEF-34 | SL · SL-002 | The smoke-test playbook is badly out of date. The user wants it deleted | `fixed` — the user deleted `playbook/smoketest-mcp-handoff.md` and `playbook/smoketest-mcp-orchestration.md` by hand. `smoketest-instances.md` and `smoketest-orchastrator.md` stay. Uncommitted as of 2026-09-23 |
| DEF-35 | SL · SL-002 | `dungeonmaster init` should add a `hydration-recipes` folder to a consumer repo that has none, so siegelense can seed from it | `fixed` — merge `ec5c87756`. Init writes a buildable package. A consumer must still run `npm install` and a build before `siegelense recipes` answers. The user decided init runs them: see DEF-36 |
| DEF-36 | SL · DEF-35 | After `dungeonmaster init` scaffolds `packages/hydration-recipes`, `siegelense recipes` fails until the consumer runs `npm install` and builds the new package. The user decided init runs both itself when it has just scaffolded the package | `fixed` — merge after `90564bd82` (see git log). Init runs `npm install` then builds the new workspace, only on the run that scaffolded it, and reports a failure with the command to run by hand. Open question for the user: init's package order is unsorted `readdirSync`, so `npm install` runs mid-sequence. The agent proposes moving it to the end of the install run |

The user's decisions for the DEF-26 fix, 2026-09-23:

1. A role page (`docs --for <scope>`) shows no About block.
2. Nothing is documented as "NOT BUILT YET". The marker and every line carrying it are removed.
3. The `planning` and `driving` scopes are deleted, because no prompt sends any agent to them. Their useful content
   moves into the pages that stay.
4. The siegelense session snippet reaches every repo, because siegelense is meant to work in every repo.

The user's decisions for DEF-32, 2026-09-23:

1. siegelense boots and drives the consumer's own app, the same way the consumer's Playwright e2e tests boot it.
2. Whatever siegelense needs is stored in `.dungeonmaster.json`. `dungeonmaster init` sets up the commands so each
   run gets its own ports. It must be generic, because the user runs the same setup on other repos.
3. siegelense has no fake-Claude mechanism of its own. It fakes exactly what the repo's Playwright setup fakes.
4. The smoke-test playbook is deleted. `dungeonmaster init` adds a `hydration-recipes` folder when a repo has none.

## Suspected defects from the exploration

The agents that wrote the feature docs read the code and flagged these. None has been seen on a real surface yet.
When the walkthrough reaches the matching case, confirm it and promote it to a `DEF-NN` row, or strike it.

| Feature · case | Suspicion | Evidence |
|---|---|---|
| SL · `run` | A two-step `run` (`goto /`, `look`) reported `duration: 0ms`. That cannot be a real duration. Seen by the driver on 2026-09-23 | `RUN: run_1 (status: done, steps: 2, duration: 0ms)` |
| SL · `kill` | `kill` reported `PROCESSES REAPED: 0 (none)` for a live `stack` lane, yet both ports closed. Either the count is wrong, or something else reaped them. Check at SL-163 | `inst_b7695731cf7340f9810a9f391e033c6c` |
| SL · `start --seed` | `start --seed` always passes empty parameters. So 4 recipes with required inputs can never seed through `start`: `quest-advances-one-step`, `session-single-turn`, `session-with-nested-chain` and `session-with-nested-subagent`. Only `run`'s `seed` step accepts parameters | `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts:393` — `parameters: {}` |
| SL · `driver` | `siegelense driver --instance <id>` can be typed by hand, though its help says nobody types it. Running it against an instance that already has a driver is untested | `packages/siegelense/src/flows/siegelense/siegelense-flow.ts:107-129` |
| SL · `profile` | `profile --spec <unknown>` may not check the name against the known specs, unlike `capacity` and `start` | No check found. Unconfirmed |
| HY-28, HY-29 | An unknown recipe name gives different error text through `start --seed` and through `run`'s `seed` step | `hydration-recipes/.../recipes-seed-run-broker.ts:36-41` against `siegelense/src/errors/recipe-unknown/recipe-unknown-error.ts:19-25` |
| HY · `attach` | The new `attach` verb has no CLI or recipe surface. Only a Jest integration test reaches it. This is a gap, not a bug | `quest-ingredient-broker.integration.test.ts` |
| OR-19 | The shared `repair` step declares no `done` route. It returns to the step that minted it. A repair after a red family `ward` might block with `no-minter`. `scrolls/orcha-changes/HANDOFF.md` calls this path reachable but untested | `packages/orchestrator/src/statics/agent-flow/agent-flow-statics.ts:96-103` |
| OR · docs | `scrolls/orcha-changes/HANDOFF.md` is stale. It says the graph reachability check at boot is unwired, but `start-server.ts` calls it. It names an `orch-codeweaver-partial` smoketest scenario that no longer exists | `packages/server/src/startup/start-server.ts:15,32` |
| MK-14, MK-15 | Nothing tests that the verdict buttons disable while a request is in flight. Nothing tests that a verdict survives a page reload | `quest-summary-human-check-verdict.e2e.ts:150` |
| MK-28 | Nothing tests that an old `quest.json` with `codeweaverSignoff` fields on an observable still loads. The contract is not `.strict()`, so it should | `flow-observable-contract.ts:61` |
| SF · `coverage`, `quest` | These print blank, with no warning, for a quest whose flow nodes still carry old sign-off fields. `flowNodeContract` is `.strict()` and the load swallows the parse failure. Seen live on quest `b4c31633-913d-4ea3-912a-76ae0d64bec4` | `flow-node-contract.ts:44`, `quest-load-broker.ts:48-49,54` |
| SF · cwd | Run from a package subdirectory, the CLI does not walk up to find the quest. It prints blank output. Seen live | `quest-find-broker.ts:30,33-34` |
| SF · empty target | An empty-string target skips the usage text and dumps a raw Zod error. A test asserts this, so it may be deliberate | `session-forensics-flow.ts:43` |
| SF · `/quest-forensics` | The slash command's steps jump from Step 5 to Step 7. There is no Step 6 | `.claude/commands/quest-forensics.md:196,262` |
| EX-04, EX-05 | The `step - pieceName` row label has no test at all. The other three label forms do | `packages/web/src/widgets/execution-panel/execution-panel-widget.tsx:381-434` |
| EX-02, EX-03 | The plan was ambiguous between nested rows and flat rows. Nested shipped. Ask the user whether nested is what they meant | `scrolls/consolidated-plan-units.md:536-541` |
| IN-16, IN-17 | `dungeonmaster init` skips `.mcp.json` whenever a `dungeonmaster` entry exists. So a stale entry never updates. This repo's `.mcp.json` still has the old hard-coded form | `.mcp.json:6`; `install-config-create-responder.ts:53-60` |
| WD-35 | A ward scope that reaches no package passes silently. `hasUnmatchedTestNamePatternGuard` does not catch it | `packages/ward/CLAUDE.md` |
| WD-46 | Ward's own `eslint --fix` can turn compiling code into code that fails to compile. It happens intermittently, and nothing guards against it | `scrolls/workflow-paralellizer-plan.md` section 9.16 |
| WD · snippet | The ward snippet says ward builds nothing. The e2e check now runs a real `npm run build` of the web bundle | `bundle-build-broker.ts:88` |

## Session log

| Date | Driver's work | Cases run | Defects opened | Defects closed |
|---|---|---|---|---|
| 2026-09-23 | Built this folder: the process, this ledger, and eight feature docs | none | none | none |
| 2026-09-23 | Restarted the walk at SL-001. Moved fix sub-agents into worktrees, merged by the driver. Reviewed the `docs` pages against their prompts. Designed and built siegelense lanes from `.dungeonmaster.json` (`scrolls/siegelense-consumer-lanes.md`). Fixed the hooks tests and the slow CLI init tests the changes broke. Full ward green (run `1790232218599-532f`), full build, init re-run with no changes | SL-001, SL-002 | DEF-26 to DEF-36 | DEF-26 to DEF-36 |
