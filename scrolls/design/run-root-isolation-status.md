# Run-root isolation — complete handoff

This file is the single entry point. A session that reads only this file should be able to finish the work without
asking anything. `run-root-isolation.md` in the same folder is the shorter design note; everything in it is restated
here.

Nothing in this change is committed. All of it sits uncommitted in the worktree named below.

---

## 1. What the user asked for, in order

1. Unblock quest `1918a5ee-8bce-4f3d-a4ab-f7ff51f45878`: merge master into its worktree, build, remove a failed
   `repair` work item and make `ward` run next. **Done** (see section 10).
2. "Diagnose the next failure." It was the siege `happyWalk` step walling on `Unknown recipe`. Root cause: lanes the
   orchestrator starts run the MAIN checkout, not the quest's worktree (section 2).
3. "See if we have other similar isolation problems in the repo." Three read-only searches found more (section 3).
4. "Is there a way we can lint for this? Is there some consolidated thing everything calls? This keeps happening."
   Answer: yes — one rule about WHO may ask "where am I running", two shared resolvers, lint at error (section 5).
5. "We should just set to error and fix. You can use master and a worktree simultaneously to test both snapshots, as
   well as /home/brutus-home/projects/assayer to test a consumer repo." One unrelated bug (DEF-272, testing package)
   may merge into master meanwhile; otherwise master is clear.
6. "Use sonnet models for it" — implementation slices go to `model: "sonnet"` sub-agents; the coordinator (you)
   designs, reviews, builds and verifies.
7. Keep this plan updated in case the session hits its usage limit.

## 2. The incident that started this

Quest `1918a5ee` (clarify panel: multi-select holds picks until send) halted at siegemaster `happyWalk`:

> Seeding recipe quest-clarify-pending-question-set on instance inst_d96988573b994b9f9196e128d6256fd8 (run_1) failed:
> 'Unknown recipe ... Known recipes: guild-empty, guild-with-three-quests, ...'

An earlier `recipe-maker` session had written that recipe in the quest worktree, built it, and proved it on its own
instance. The walker's lane could not see it. Evidence:

- `packages/orchestrator/src/brokers/lane/provision-batch/lane-provision-batch-broker.ts:107` called
  `instanceStartBroker({ specName, questId, guildId, seed: null })` — the quest id, never its worktree path.
- `packages/siegelense/src/brokers/instance/start/instance-start-broker.ts:230-231` —
  `const cwdSeed = cwd(); const repoRoot = await cwdResolveBroker(...)`. That runs inside the prod server, whose cwd
  is the main checkout. Line 268 spawned the driver with `cwd: repoRoot`; line 238 took the CLI bin from
  `cliPackageBinResolveBroker()` = `require.resolve('@dungeonmaster/cli')` = the server's own install.
- Inside the driver, `lane-boot-broker.ts:94-96` and `recipes-locate-broker.ts:24-25` resolved from `cwd()` again.
- Checked on disk: the worktree's `packages/hydration-recipes/dist` contained the recipe; the main checkout's did not.
- `recipe-maker` succeeded because an agent started its instance via the `dungeonmaster` CLI FROM the worktree.

**Severity:** every lane the router starts serves master's API, web, recipes and `.dungeonmaster.json`. A siege walk
that "passes" on such a lane proves nothing about the quest. A new recipe was simply the first case that errored
instead of passing falsely.

## 3. Everything the isolation audit found

Three read-only sweeps (orchestrator; siegelense + hydration; server/mcp/ward/cli/hooks/shared). Disposition column
says what this change does about each.

### 3a. Affects quests now

| Where | Problem | Disposition |
|---|---|---|
| Lanes: `lane-provision-batch-broker.ts:70,107` → `instance-start-broker.ts:230,238` | lanes run main's code/recipes/config | slices 10, 11, Step B |
| `quest-modify-broker.ts:364` (`questRepoRootBroker`) | contract `source` and `packagesAffected` checked against main during `in_progress`: worktree-only file refused, worktree-deleted file accepted, package type measured from master | slice 5 (done) |
| `lane-kill-broker.ts:35` (`require.resolve`) | lanes killed by the server's own siegelense; module cached for server life | Step B |
| `step-handler-cleanup-broker.ts:56` | siege sweep steps run master's `siegelense cleanup` | slice 5 + 12 (done) |
| `served-build-stale-read-broker` | staleness check only runs for `siegelense start`, never router lanes | deferred gap (section 9) |
| Recipe import cache (`dynamicImport` in `recipes-read-broker.ts:29`, `step-seed-broker.ts:80`) | driver keeps the first-loaded recipes for the lane's life | deferred gap |

### 3b. Every ambient read inside siegelense the lane fix had to cover
`instance-start-broker.ts:230` (driver cwd), `:238` (CLI bin), `lane-spec-find-broker.ts:46` (read by server, driver,
heartbeat sampling and capacity — mismatched reads file samples under different `specHash`), `instance-reserve-broker.ts:73`
(registry records main's branch), `lane-boot-broker.ts:94`, `recipes-locate-broker.ts:24`,
`locations-repo-link-path-find-broker.ts:33`, `served-build-stale-read-broker.ts:45,120`,
`locations-recipes-package-path-find-broker.ts:21` (no caller). Registry/evidence/socket paths were fine: they come
from `DUNGEONMASTER_HOME` / `tmpdir()`, not cwd.

### 3c. Interactive sessions opened inside a worktree only
Dispatched agents are safe: `agent-spawn-stream-json-broker.ts:67-76` puts the worktree's `node_modules/.bin` first on
PATH and passes `DUNGEONMASTER_HOME` through.
- Generated hook commands are bare names (`dungeonmaster-hooks-creator-transformer.ts:33-85`) and the post-install
  `dungeonmaster gateway-sync` is bare (`gateway-sync-hook-statics.ts:14`) → main's hooks run. **Deferred gap.**
- `.mcp.json:8` defaults home to `$(pwd)/.dungeonmaster` → empty store in a worktree. **Deferred gap** (prod sets an
  absolute home).
- `dungeonmaster siegelense …` run in a worktree loaded the CLI's own (main) siegelense — **fixed in slice 9**.

### 3d. Low impact, left alone
`bin-walk-up-layer-broker.ts:28` (ward bare-name fallback when a worktree lacks a jest/eslint/tsc bin),
`mcp-server-statics.ts:16` (MCP falls back to global — scenario 4 by design), `source-condition-supported-broker.ts:35`,
root `npm run siegelense` script sets home from `$(pwd)`.

### 3e. Checked and correct
Ward child spawns, commit/ward step handlers, prompt `startRef`, blight checklist, chat replay, dispatch spawns, every
server responder (they hand quest work to the orchestrator by id), riftcarver/worktree brokers (the carve legitimately
runs from the repo root), `quest-cwd-resolve-broker`'s pre-carve fallback.

## 4. Why it kept happening

- `@dungeonmaster/no-bare-process-cwd` already existed at `error` to stop exactly this. It allowlisted the gateway's
  own process wrapper, and that wrapper EXPORTS `cwd`. Everything imports `cwd` from `#gateway/node/process`, so the
  rule never fired. 29 production files read it at any depth.
- Brokers written for a CLI (where cwd is right) were reused from the server (where cwd is always main).
  `instanceStartBroker` is the clearest case: written for `dungeonmaster siegelense start`, called by the router.
- `require.resolve` of our own packages answers "where is THIS process installed" = main checkout inside the server.
- `local-eslint`'s `ban-self-located-repo-lookup` message told authors to use "process.cwd() in a CLI entry point",
  steering them toward the bug.

## 5. The design (what "the consolidated thing" is)

**Rule: the entry layer may read where it is running. Everything below it takes the location as a REQUIRED parameter.**

| Need | The one way | Ambient reads allowed only in |
|---|---|---|
| Repo root for CLI/hook/MCP work | entry point reads `cwd()`, passes it down | `startup/`, `responders/`, tool `*.config.*` files |
| Repo root for QUEST work | `questCwdResolveBroker` (worktree once carved, repo root before) | `questRepoRootBroker` only in `quest-cwd-resolve-broker.ts`, `step-handler-riftcarver-broker.ts`, its own folder |
| One of our modules at runtime | `moduleResolveBroker({ specifier, repoRoot })` | `require.resolve` only in that broker and `packages/@gateway/**` |
| One of our binaries | `packageBinResolveBroker({ binName, repoRoot })` | nowhere — never a bare command name |

### Decisions and reasons
- **Required parameters, no defaults.** A `= cwd()` default makes a forgotten argument silently pick the wrong
  checkout; required makes it a type error.
- **Responders may read cwd.** A responder handles one specific entry; brokers are reused across entries. Startup-only
  would force threading through every flow for no safety gain.
- **Tool config files (`*.config.*`) may read cwd.** Vite/Playwright/Jest load them as their process entry
  (`packages/web/vite.config.ts` needs it).
- **`moduleResolveBroker` falls back to the process's own install** only when `repoRoot` has none — the global-only
  consumer (CLAUDE.md "MCP resolution" scenario 4). Result says which answered.
- **`packageBinResolveBroker` never falls back to a bare name** — PATH is exactly what resolves to the wrong checkout;
  it throws instead.
- **`no-bare-process-cwd` stays in the SHIPPED plugin** (eslint-plugin): the hole is in consumers' copies of the node
  gateway too. Consequence: consumers (assayer) may get new errors; list them for the user, don't relax the rule.
- **The two new rules are repo-local** (local-eslint): the server-reusing-CLI-brokers shape is this repo's.
- **Lint cannot check the caller passed the RIGHT root**, so each server-side path gets a test with server cwd ≠ quest
  worktree (lane start, lane kill, cleanup, modify-quest).
- **Hooks' bare commands are out of scope** — fixing them needs a decision about how Claude Code resolves a hook's
  PATH, and it changes what `init` writes for consumers.

## 6. Definition of done

1. All four rules (section 7) at `error`; `npm run ward -- --only lint -- packages` reports none of them.
2. No production use of: gateway `cwd()` outside the allowed folders, `require.resolve` outside `moduleResolveBroker`,
   `questRepoRootBroker` outside its allowlist, `dungeonmasterBinResolveBroker`, `cliPackageBinResolveBroker`.
3. Regression tests where server cwd ≠ quest worktree for lane start, lane kill, cleanup, modify-quest; and lane-boot
   spawning in the repoRoot it was given.
4. Master merged in; bare `npm run ward` exits 0.
5. Live proof (Step E): a lane started from a process whose cwd is the main checkout, given a worktree root, seeds a
   recipe only that worktree has; given the main root, the same seed reports `Unknown recipe`.
6. Assayer checked (Step F); new rule hits reported to the user.
7. Committed on branch `run-root-isolation`; the user asked before merge to master.
8. Quest `1918a5ee` unblocked (Step H).

## 7. The rules as built (all `error`)

| Rule id | Location | Allowed |
|---|---|---|
| `@dungeonmaster/no-bare-process-cwd` | `packages/eslint-plugin/src/brokers/rule/no-bare-process-cwd/`, statics `packages/eslint-plugin/src/statics/no-bare-process-cwd/`, guard `packages/eslint-plugin/src/guards/is-gateway-cwd-call/` | `process.cwd()` or gateway `cwd()` (named, aliased, namespace) only in `**/src/startup/**`, `**/src/responders/**`, `**/*.config.{ts,js,mjs,cjs}`, `**/src/startup/start-install.ts`, `**/packages/@gateway/node/src/process/**`, tests/proxies/harnesses |
| `@dungeonmaster-local/ban-ambient-module-resolve` | `packages/local-eslint/src/brokers/rule/ban-ambient-module-resolve/`, statics, guard `is-ban-ambient-module-resolve-exempt-file`; `eslint.config.js` ~line 154 | `require.resolve` only in `packages/shared/src/brokers/module/resolve/module-resolve-broker.ts`, `packages/@gateway/**`, tests |
| `@dungeonmaster-local/enforce-quest-cwd-resolve` | `packages/local-eslint/src/brokers/rule/enforce-quest-cwd-resolve/`, statics | importing `questRepoRootBroker` only in the allowlist of section 5 |
| `@dungeonmaster-local/ban-self-located-repo-lookup` | unchanged check | message now: "Pass a path from the input instead: the linted file's directory, or a repo root the caller passed in. Only an entry point (startup/, responders/) reads where it runs." |

## 8. The shared resolvers as built

In `packages/shared/src/brokers/`, exported from `@dungeonmaster/shared/brokers`:
- `moduleResolveBroker({ specifier: string; repoRoot: string }): ModuleResolution` — SYNC. Node resolution from
  `repoRoot` via gateway `resolveModuleIfExists({ specifier, fromDir })` (`packages/@gateway/node/src/module/resolve-module-if-exists/`,
  exported from `#gateway/node/module`), then own install. Returns `{ path, resolvedFrom: 'run-root' | 'own-install' }`;
  throws naming specifier and repoRoot.
- `packageBinResolveBroker({ binName: string; repoRoot: string }): Promise<BinCommand>` → `{ command: execPath,
  leadingArgs: [<package root>/<bin entry>] }`. Owner from shared `dungeonmasterBinStatics.packages`
  (`dungeonmaster-ward` → `@dungeonmaster/ward`, `dungeonmaster` → `@dungeonmaster/cli`). Throws, never bare.
- Shared contracts `bin-command`, `package-bin-manifest`, `module-resolution`; statics `dungeonmaster-bin`.

## 9. Known gaps deliberately left (tell the user in the final report)
- Hook commands in generated `.claude/settings.json` are bare bin names (section 3c).
- `.mcp.json` home default in a hand-opened worktree session.
- Driver caches the recipes module per lane.
- Served-build staleness check not run for router-started lanes.

## 10. Quest 1918a5ee state (already done earlier this session)
- Master merged into `worktrees/clarify-panel-multi-select-holds-picks-until-sen-1918a5ee` (commit `d942cf88f`);
  conflicts in two clarify-panel proxies resolved keeping the quest's helpers with master's `Node['textContent']`.
  Needed `npm install` there (master moved TypeScript 5.8.3 → 6.0.3), then `npm run build` passed.
- Its failed `repair` item `5513e726` was deleted, the `ward` item `d05a5be9` reset to pending; backup at
  `<main>/tmp/quest-1918a5ee-backup.json`. The quest then resumed, ward and repair succeeded, flowrider planned
  `empty`, and siege walled on the recipe (section 2). It is now `blocked` again. Step H unblocks it.

---

## 11. Where and how to work

- Worktree: `/home/brutus-home/projects/codex-of-consentient-craft/worktrees/run-root-isolation`, branch
  `run-root-isolation`, from master `f2444bd4d`. Run every command there. Check `git status` first.
- **Never** `git stash`, `git reset`, `git checkout -- .` in it. Commit means commit on the current branch.
- Sub-agents: `model: "sonnet"`, `subagent_type: "general-purpose"`, background. They never build, commit, fork or
  dispatch. You build. Brief template in section 15.
- Search with the `discover` MCP tool (`ToolSearch "select:mcp__dungeonmaster__discover"`); bash grep/find are
  hook-blocked; `python3` scans work.
- Ward: `npm run ward -- --only lint,typecheck,unit -- <files>`, `timeout: 600000`, pipe to `tail`. Never `cd` into a
  package. Never sleep on a run.

## 12. Facts learned the hard way
1. `@gateway/*` packages are typechecked from `dist`: after editing `packages/@gateway/node/src/**`, run
   `npm run build --workspace=@dungeonmaster/node`, or dependents report `TS2305`.
2. Spawned children (siegelense driver, CLI integration tests) load `@dungeonmaster/shared` and siblings from `dist`.
   After shared changes they fail with e.g. `dungeonmasterBinStatics is not defined` until
   `npm run build --workspace=@dungeonmaster/shared` (then siegelense / cli). Build only while no agent runs ward.
3. Parallel agents editing the same registration files (local-eslint create responder + tests, `eslint.config.js`)
   collide; tell them to re-Read right before each edit.

## 13. Slice status

DONE = the agent reported its scoped ward green. RUNNING = in flight when this was written; it may have died with the
previous session — run its check before trusting it.

| # | Slice | Status | Facts the next step needs |
|---|---|---|---|
| 1 | Shared resolvers + gateway wrapper | DONE | `@dungeonmaster/node` rebuilt in the worktree. |
| 2 | `no-bare-process-cwd` hole closed | DONE | `*.config.*` allowlisted by the coordinator with a RuleTester case. |
| 3 | `ban-ambient-module-resolve` | DONE | |
| 4 | `enforce-quest-cwd-resolve` + message fix | DONE | |
| 5 | `quest-modify-broker`, `step-handler-cleanup-broker` → `questCwdResolveBroker` | DONE | missing-worktree throws. Tests: worktree-only contract accepted, repo-root-only refused; cleanup spawns in the worktree. **Review:** the agent said the cleanup proxy "mocks questCwdResolveBroker" — confirm it composes `questCwdResolveBrokerProxy`, not a `registerMock` of a same-package broker. |
| 6 | Hooks | DONE | 7 brokers require `cwd`; agy pre-tool uses `workspacePaths[0]` else `cwd()`; post-ask-question passes `startDir: hookData.cwd`. Package lint + integration PASS. |
| 7 | MCP | DONE | `callerRepoRootResolveBroker({ …, serverCwd })`; `fileScannerBroker` / `mcpDiscoverBroker` require `rootPath`. Package lint + integration PASS. |
| 8 | Shared/forensics/orchestrator cwd sites | DONE | Require `startDir`: `portResolveBroker`, forensics `questFindBroker`/`questLoad`/`questIndexLoad`, `orchestrationModeGetBroker`, `questMcpCreateBroker`, `questGetServerConfigBroker`, mcp `orchestratorGetQuestStatusBroker`; `questMonitorJsonlWatcherBroker` requires `projectDir`. |
| 9 | CLI/server `require.resolve` | DONE, one open failure | serve/siegelense responders resolve from `cwd()`; `http-backend-package-resolve` and `web-bundle-package-resolve` resolve their own deps from their own `projectRoot`; new `packages/cli/src/startup/start-cli-context.ts`. **OPEN:** `packages/cli/bin/cli-entry.integration.test.ts` "siegelense piped into a reader that closes early" → `No package.json found starting from /tmp/dungeonmaster-e2e-…` because siegelense resolves a repo root up front from a non-repo cwd. Fix in slice 10: resolve the root only in calls that need one. |
| 10 | Siegelense SERVER side | DONE — siegelense lint/typecheck/unit PASS (1431 files), siegelense integration PASS (26 incl. driver-flow), `cli-entry.integration.test.ts` PASS (slice-9 failure fixed: `SiegelenseStatusResponder` falls back to `cwd()` on `ProjectRootNotFoundError`). FINAL SIGNATURES: `instanceStartBroker({ specName, questId, guildId, seed, idleTimeoutMs?, repoRoot })`; `capacityReadBroker({ specName, poolSize, repoRoot })`; `laneSpecFindBroker({ specName, repoRoot })`; `recipesLocateBroker({ repoRoot }): string` (now SYNC); also `repoRoot` on `instanceReserveBroker`, `profileReadBroker`, `profileSampleRecordBroker`, `profileSoloReadLayerBroker`, `recipesReadBroker`, `recipeSeedRunBroker`, `servedBuildStaleReadBroker`. `cli-package/bin-resolve/` deleted. `stepSeed`/`stepReset` use `lane.repoRoot`. OPEN (Step C): kill and cleanup responders resolve the repo root up front and would throw outside a repo if reached there — give them the same `ProjectRootNotFoundError` → `cwd()` fallback as status. ORIGINAL BRIEF: `instanceStartBroker` REQUIRED `repoRoot`, no `cwd()`, driver spawned with `cwd: repoRoot` and CLI from `packageBinResolveBroker({ binName: 'dungeonmaster', repoRoot })`; delete `packages/siegelense/src/brokers/cli-package/bin-resolve/`; `instance-reserve` branch from `repoRoot`; `laneSpecFindBroker` requires `repoRoot` (callers instance-start, driver responder, `profile-sample-record` via heartbeat tick, `capacity-read`, `profile-read`); `recipesLocateBroker` requires `repoRoot` (callers `recipes-read`, `recipe-seed-run`, `step-seed` via `lane.repoRoot`); `served-build-stale-read` requires `repoRoot`; `siegelense-start-responder` and capacity responder read `cwd()` → `cwdResolveBroker({ kind: 'repo-root' })`. Forwarded: pass `repoRoot` to `instanceKillBroker` (2 calls) and `locationsRepoLinkPathFindBroker` (4 calls) in instance-start; its proxy's `setupCwd` and the repo-link proxy's `cwdPath` are gone; failing then: unit `instance-start`, `step-reset`, `driver-heartbeat-tick`, `siegelense-driver-responder`; integration recipes flow + seed-run (`repoRoot` of `undefined`); plus the slice-9 failure. Test: repoRoot ≠ process cwd → driver cwd and bin from repoRoot. **Check:** `npm run ward -- --only lint,typecheck,unit -- packages/siegelense 2>&1 \| tail -80` and the cli-entry integration test. |
| 11 | Siegelense DRIVER side | DONE | `LaneSession.repoRoot` required. Required `repoRoot`: `laneBootBroker`, `locationsRepoLinkPathFindBroker({ homePath, repoRoot })`, `instanceKillBroker({ instanceId, repoRoot, reason? })`, `statusReadBroker`, `instanceEntryLayerBroker`, `cleanupRunBroker({ repoRoot })`, `staleReapLayerBroker`, `stepVideoBroker`. Driver/status/kill/cleanup responders resolve it from `cwd()`. `locations-recipes-package-path-find` deleted. |
| 12 | Orchestrator bin swap | DONE | 4 callers (ward step, ward-detail, cleanup, riftcarver preflight) use shared `packageBinResolveBroker`; orchestrator copies deleted; shared dup-contract lint gone; orchestrator typecheck/unit/integration PASS. Only lint hits left: the two lane brokers (Step B). Tests now assert `execPath` + resolved script instead of bare names. |

## 14. Remaining steps, in order

**User instruction (latest):** "don't launch any more agents." The Step B agent was already running; no further
agents were dispatched. A new session should do Steps C–H itself, or ask the user before dispatching any agent.

**Progress marker:** Steps A and B are DONE. Next is Step C — NOT started; nothing was changed by it.
Step C note: `npm run ward -- --only lint -- packages` checks NOTHING (ward reports "NO CHECK PROCESSED these paths"
for a bare `packages` dir). Pass each package directory explicitly, e.g.
`npm run ward -- --only lint -- packages/cli packages/config packages/eslint-plugin packages/hooks packages/hydration packages/hydration-recipes packages/local-eslint packages/mcp packages/orchestrator packages/server packages/session-forensics packages/shared packages/siegelense packages/testing packages/tooling packages/ward packages/web packages/@gateway/node packages/@gateway/npm packages/@gateway/browser packages/@gateway/bin 2>&1 | tail -80`
(timeout 600000). Packages whose lint already passed whole-package after their slice: hooks, mcp, orchestrator,
siegelense (lint+typecheck+unit), cli + server (lint). Not yet linted whole: config, eslint-plugin, hydration,
hydration-recipes, local-eslint, session-forensics, shared, testing, tooling, ward, web, the gateways.
Also still open for Step C: the kill and cleanup siegelense responders' `ProjectRootNotFoundError` → `cwd()` fallback
(slice 10 row), and the slice-5 cleanup-proxy review.
Step B result: `lane-provision-batch-broker` and `lane-kill-broker` resolve the quest checkout with
`questCwdResolveBroker`, load siegelense via `moduleResolveBroker(...).path`, pass `repoRoot` to `capacityReadBroker`,
`instanceStartBroker`, `instanceKillBroker`. `missing-worktree` throws (`Cannot start a lane for quest <id>: worktree
not found: <path>` / `Cannot kill a lane …`). `laneKillBroker` now takes `{ questId, instanceId }`; its one caller
`quest-work-record-broker.ts` passes `questId`. Contracts `siegelense-lane-provision-module` and
`siegelense-instance-kill-module` updated. Tests: worktree ≠ cwd, no worktree, missing worktree for both brokers.
Ward: lane folders + contracts + work-record lint/typecheck/unit PASS; `packages/orchestrator` lint PASS (no rule
hits) and integration PASS (42 files).

**Step A — slice 10.** Run its check. If unfinished, dispatch a fresh Sonnet agent with the slice-10 row as its brief
plus sections 5, 8, 11, 12. Include the slice-9 failure.

**Step B — orchestrator lanes** (after slice 10; read its final signatures first). One Sonnet agent:
- `lane-provision-batch-broker.ts`: `questCwdResolveBroker({ questId: quest.id })` (missing-worktree → throw); replace
  `require.resolve(SIEGELENSE_BROKERS_MODULE_NAME)` with `moduleResolveBroker({ specifier: '@dungeonmaster/siegelense/brokers', repoRoot }).path`;
  pass `repoRoot` into `capacityReadBroker` and `instanceStartBroker`.
- `lane-kill-broker.ts`: same module resolution; pass `repoRoot` to `instanceKillBroker`.
- Update `packages/orchestrator/src/contracts/siegelense-lane-provision-module/` (contract, stub, test) and both
  brokers' proxies/tests/PURPOSE headers. Test: quest `worktreePath` ≠ process cwd → `instanceStartBroker` gets the
  worktree and the module resolves from it.
- Verify `npm run ward -- --only lint,typecheck,unit -- packages/orchestrator/src/brokers/lane packages/orchestrator/src/contracts/siegelense-lane-provision-module`.

**Step C — sweep.** `npm run ward -- --only lint -- packages 2>&1 | tail -120`. Fix every hit of the four rules by the
section-5 pattern; never allowlist to pass. `discover` must find no `dungeonmasterBinResolveBroker`,
`cliPackageBinResolveBroker`, or production `require.resolve(` / `questRepoRootBroker(` outside the allowlists.
Do the slice-5 proxy review.

**Step D — build, merge, full ward.** `npm run build`; `git merge master`; rebuild if needed; bare `npm run ward`
(timeout 600000) to exit 0. Every failure is yours.

**Step E — live proof.** Write a throwaway script in `<this worktree>/tmp/` that runs with `process.cwd()` = the MAIN
checkout, imports THIS worktree's built `@dungeonmaster/siegelense/brokers`, calls `instanceStartBroker` with
`repoRoot` = the quest worktree `worktrees/clarify-panel-multi-select-holds-picks-until-sen-1918a5ee` (it has recipe
`quest-clarify-pending-question-set`; it must be built), then seeds that recipe (`dungeonmaster siegelense docs --for
seeding` explains the seed step). Expect success. Repeat with `repoRoot` = the main checkout; expect `Unknown recipe`.
Kill both instances. Paste both outputs under a "Proof" heading in this file.

**Step F — consumer proof.** `/home/brutus-home/projects/assayer` links dungeonmaster via `file:`. After the build, run
its own lint and typecheck through its npm scripts (bare `tsc` / `npx eslint` are hook-blocked). List every new
`no-bare-process-cwd` hit for the user and ask whether to fix them; do not relax the rule. If time allows:
`npm run build:clean` then `npm run check:consumer` here.

**Step G — commit and report.** Commit on `run-root-isolation`; message names the checks run and ends with the
attribution line the harness supplies. Report to the user: what changed, proof outputs, assayer hits, section 9 gaps.
**Ask before merging into master.** After merge: `npm run build`, `npm link --workspaces`, restart `npm run prod`.

**Step H — unblock quest 1918a5ee.** After the fix is on master and prod is rebuilt:
1. Merge master into its worktree; `npm install` if the lockfile changed; `npm run build` there.
2. With prod stopped, back up `<main>/.dungeonmaster/guilds/21523917-83f7-4e23-a6de-8db1cae2ad96/quests/1918a5ee-8bce-4f3d-a4ab-f7ff51f45878/quest.json`
   to `<main>/tmp/`. The siege scope has happyWalk items `394eff35-f546-482a-80ab-8b8eef7d8776` (failed, wall) and
   `6f58a240-2615-4ac4-9049-9d354e31e496` (complete, unmet). Delete the walled item and its `sessions` row; set the
   walker items back to `pending` clearing `startedAt`, `completedAt`, `declaredWord`, `declaredReason`,
   `errorMessage`, `sessionId`, `payload.instance`. Or ask the user whether they prefer a fresh siege plan. Validate
   with the `get-quest` MCP tool. Leave status `blocked`; the user presses Resume.
3. Its quest note `recipe-maker-siegelense-listing-pin`: `siegelense-recipes-layer-flow.integration.test.ts` needs the
   new recipe in its listing pin, or that worktree's next ward goes red.

## 15. Sub-agent brief template

> You are implementing one slice of a planned change in a dungeonmaster monorepo WORKTREE. Never fork, never dispatch
> sub-agents, never run a build, never commit. Worktree: /home/brutus-home/projects/codex-of-consentient-craft/worktrees/run-root-isolation
> — every path under it; run commands from there with absolute paths. Other agents may edit other files concurrently;
> re-Read any shared file right before editing it. Read `scrolls/design/run-root-isolation-status.md` sections 5, 8,
> 11, 12 first. Before writing code load via ToolSearch
> "select:mcp__dungeonmaster__get-architecture,mcp__dungeonmaster__get-testing-patterns,mcp__dungeonmaster__get-folder-detail,mcp__dungeonmaster__discover"
> and call get-architecture, get-testing-patterns, get-folder-detail for each folder type you write. Bash grep/find
> are blocked; use discover. [SLICE TEXT]. Verify with `npm run ward -- --only lint,typecheck,unit -- <files>`
> (timeout 600000, `| tail -80`); run each new test alone first and assert on its real output. Report under 300 words:
> files changed, final signatures, ward summary lines.

## 16. Proof (Step E)

Executed from the **main checkout** (`process.cwd() = /home/brutus-home/projects/codex-of-consentient-craft`) importing the built `@dungeonmaster/siegelense` brokers from `worktrees/run-root-isolation`:

```
=== TEST 1: Starting instance with repoRoot = QUEST_WORKTREE ===
Current process.cwd(): /home/brutus-home/projects/codex-of-consentient-craft
Target repoRoot: /home/brutus-home/projects/codex-of-consentient-craft/worktrees/clarify-panel-multi-select-holds-picks-until-sen-1918a5ee
SUCCESS: Instance started and seeded successfully!
Instance ID: inst_3d66e923f93048019da815ff825d1e21
Killing test instance: inst_3d66e923f93048019da815ff825d1e21
Kill result: {
  "instanceId": "inst_3d66e923f93048019da815ff825d1e21",
  "stopped": true,
  "portsReleased": [
    38539,
    33059
  ],
  "homeRemoved": true,
  "evidenceKept": {
    "path": "/home/brutus-home/.dungeonmaster/siegelense/unowned/instances/inst_3d66e923f93048019da815ff825d1e21",
    "linkPresent": false
  },
  "reapedPgids": [],
  "killed": [
    634783,
    634785
  ]
}

=== TEST 2: Starting instance with repoRoot = MAIN_CHECKOUT ===
Current process.cwd(): /home/brutus-home/projects/codex-of-consentient-craft
Target repoRoot: /home/brutus-home/projects/codex-of-consentient-craft
EXPECTED FAILURE: Could not seed on main checkout!
Error message: recipesSeedRunBroker: unknown recipe 'quest-clarify-pending-question-set' — known recipes: guild-empty, guild-with-three-quests, guild-mid-execution, quest-advances-one-step, quest-completed, session-single-turn, session-with-nested-chain, guild-active-suite, session-with-nested-subagent
```
