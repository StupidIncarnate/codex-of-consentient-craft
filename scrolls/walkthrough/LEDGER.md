# Walkthrough ledger

The driver keeps this file current. `README.md` says how.

## Cursor

| | |
|---|---|
| Feature | `features/01-siegelense.md` |
| Next case | `SL-044` — `siegelense start --spec dungeonmaster-stack`, the first case of Phase 1 |
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

Next free number: **DEF-26**. It starts there because commits and older scrolls already use DEF-01 to DEF-25
for a siegelense walkthrough that finished before this one.

| # | Feature · case | Defect | Status |
|---|---|---|---|

## Suspected defects from the exploration

The agents that wrote the feature docs read the code and flagged these. None has been seen on a real surface yet.
When the walkthrough reaches the matching case, confirm it and promote it to a `DEF-NN` row, or strike it.

| Feature · case | Suspicion | Evidence |
|---|---|---|
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
