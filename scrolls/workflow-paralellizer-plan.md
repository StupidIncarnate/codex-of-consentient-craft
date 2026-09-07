# Section J implementation plan

**What this is.** The work plan for §J of `scrolls/workflow-paralellizer.md`. That scroll holds the evidence and
the direction. This scroll holds the steps, the files, the tests that pin them, and the decisions the owner has to
make before each step.

**How it was made.** One read-only survey agent per package (14) plus one for the repo root. Each agent read §J and
§K, then reported what its package holds that §J touches, misses, or gets wrong. This plan merges those 15 reports.
Every `path:line` below comes from one of them. The raw reports are not committed.

**Status.** Implementation in progress against commit `8ffc6f2f8`. Section 9 is the execution log: what each step
actually measured, every place the code contradicted this plan, and every decision the implementing session changed.
**Read section 9 before starting a step** — several line numbers in sections 4 and 5 are stale, and section 9 says
which. The owner has read sections 1 to 3 and settled the rows marked **Decided** in section 2.

**How to read it.**

| Read                                   | For                                                                                        |
|----------------------------------------|--------------------------------------------------------------------------------------------|
| 0. How to run this plan                | Rules for the session doing the work, what to fan out, and every probe to run before a step |
| 1. What the surveys changed            | Eleven findings that alter §J's plan. Read these before the steps                           |
| 2. Decisions before starting           | Owner calls, grouped by step. Rows marked **Decided** are settled                           |
| 3. The three surfaces                  | Who tells an agent how to run ward, who reads each, and the exact text each says afterwards |
| 4. Steps 0 to 7                        | The work, in order. Each step lists files, pinning tests, and done-when                     |
| 5. Corrections owed to the scroll      | Claims in §J and §K the code contradicts                                                    |
| 6. Bugs found on the way               | Not caused by the pivots, but in their path                                                 |

Terms used throughout. **Ward** is the quality runner (`npm run ward`). **`dist/`** is a package's compiled output.
**Stale green** is a check that passes against source it never saw. **Pivot 1** to **Pivot 5** are §J's five
changes, always written in full. **Step 0** to **step 7** are the work items; steps 1 to 7 follow §J4's order, and
step 0 is the tests written before them. **P1** to **P16** are the probes in section 0.3. **D3.1**, **D7.2** and so
on are the decision rows in section 2, numbered by the step they gate.

---

## 0. How to run this plan

This section is for the session that implements the plan. That session did not write it and has not read the
surveys. Read this section, then section 1, then section 3. Read a step only when you start it. Read the scroll's
§J and §K only where a step cites a line.

### 0.1 Rules for the session doing the work

| Rule | Why |
|---|---|
| Commit on `master`. One commit per step. Steps 5.1 and 5.2 are two commits. Steps 7a and 7b are one. Put the step number in the commit subject. | Root `CLAUDE.md`, "Committing": commit means on the branch you are on. The per-step commit is the rollback unit. |
| You work directly for the user, so you are on rung 3 of the ladder (section 3). Before each commit: `npm run build` as its own command, exit 0, then `npm run ward`, exit 0. You own every failure in it, including ones you did not cause. | The ward-discipline snippet and root `CLAUDE.md` rule 1. Until step 5.2 lands, ward still reads `dist`, so the build before ward is still true for you. After 5.2, `npm run build` is only for the rows in 3B's table, and you still run it before a commit because the MCP child and the hooks run from `dist`. |
| Sub-agents you dispatch are on rung 1. Name their files. Their ward line is `npm run ward -- -- <files>`. One to three files per cleanup agent. `model: sonnet` for mechanical fan-outs. | Root `CLAUDE.md`, "Dispatching Sub-Agents". |
| Never hand-edit `.claude/settings.json`, `.mcp.json`, or any `.env*`. Settings regenerate through `npm run build && npm link --workspaces && npm run init`. | Root `CLAUDE.md`. Step 7 changes the hook set; that is how the change reaches `settings.json`. |
| After every `npm run build`, reconnect the MCP server before the next `mcp__dungeonmaster__*` call. | The stdio child loaded `packages/mcp/dist/src/index.js` at boot and the build overwrote it (`packages/mcp/CLAUDE.md:84-96`). |
| Scratch goes in `<repoRoot>/tmp/`, never `~/tmp` and never the OS `/tmp`. `tmp/loader-probe/` and the scroll's probe scripts are there already. | Root `CLAUDE.md`, first paragraph. |
| Bare `jest`, `npx jest`, `tsc`, `npx eslint`, `grep`, `find`, `rg` and `sed` are blocked by the pre-bash hook. Verification goes through ward. A probe that truly needs bare jest uses `node node_modules/.bin/jest --config <tmp config>`; never use that form for a verdict. | `packages/hooks/src/guards/is-blocked-quality-command/is-blocked-quality-command-guard.ts:9-10`. |
| A step's done-when fails: fix it before the next step. Never proceed red. Never mark a step done with a skipped check. | Every later step assumes the earlier one holds. |
| When you touch a file a step's table does not list, add it to the table before you edit it. When a probe changes a decision, edit the decision row and say why. | The next session reads this document, not your transcript. |
| Ward runs in the foreground with `timeout: 600000`. Never sleep beside it, never tail its output, never run it twice to see if the first finished. | The ward-discipline snippet. |

### 0.2 What to do yourself and what to fan out

| Step | Do yourself | Fan out, sonnet, one to three files per agent |
|---|---|---|
| 0 | the four tests | — |
| 1 | both brokers and the new test case | — |
| 2 | the contract, the broker, the transformer | — |
| 3 | 3a, 3b, 3c, the ward spawn change | 3d, 3e, 3f: one agent per harness file, each told the exact spawn line |
| 4 | the bundle broker, the hash adapter, the closure transformer, the e2e broker env var | the web config edits; the prune script |
| 5.1 | the ward deletion, as one commit | the K8 orphan deletions, one agent per folder, after you have removed every caller |
| 5.2 | the root tsconfig, the generator, the build scripts, the `files` fields, the commit | the 12 package splits, one agent per package. Give each the D5.2 exclude list and its package's row in the step 5.2 table. Tell each to keep `rootDir` and `bin/**` where the row says so |
| 6 | 3A and 3B by hand; the final content search | 3C role prompts, one agent per prompt file with its test; 6c, 6d, 6e doc rows, one agent per file. Give each agent the exact after-text from section 3, not a paraphrase |
| 7 | `createWorktree`, the seed and verify brokers, the hook block, the tool registration | the permission pin list in 7b (about 29 edits across 9 files); the 7c rows |

### 0.3 Go and look: probes to run before a step

Each row is something this document could not settle by reading. Run it before the step named, write the result
into that step, and change the step if the answer says so.

| # | Before | Run | The answer that decides |
|---|---|---|---|
| P1 | 3 | Done. `tmp/loader-probe/`, recorded in D3.2. | — |
| P2 | 3c | After changing `install-testbed-create-broker.ts:78`: `npm run ward -- --only integration -- packages/cli packages/hooks packages/mcp` | every install-flow integration test still resolves `dungeonmasterRoot` to the repo root |
| P3 | 3c | After changing `shared-package-resolve-adapter.ts:17-21`: start the MCP server with `packages/mcp/start-server.sh` and call `discover({ glob: "packages/shared/src/statics/**" })` | results scoped to `packages/shared`, not the whole tree |
| P4 | 4 | From `packages/web`: `npx vite build --outDir <repo>/packages/web/.ward/bundle/.tmp-probe`, then `npx vite preview --outDir <that path>` on `DUNGEONMASTER_WEB_PORT` with an API server on `DUNGEONMASTER_PORT` | `dist/` untouched; the preview serves the bundle and proxies `/api` and `/ws`; note the build time, expect about 10s |
| P5 | 4 | Run P4's build twice at once into two temp directories, then `rename` both to the same `<hash>/` | one rename wins; the loser's temp directory is removed; the winner's bundle is intact |
| P6 | 4 | Hash D4.2's file list over web's closure with the new adapter | under 0.5s; the scroll measured 0.10s over 7,552 files |
| P7 | 5.2 | With the `paths` map in the root tsconfig: move `packages/shared/dist` aside, run one e2e spec through `npm run ward -- --only e2e -- <spec>` | passes: G12 is closed, delete 4c's residual build of `shared` and `testing`. Dies at `playwright.config.ts:4`: keep 4c |
| P8 | 5.2 | After the split: `npm run ward -- --only typecheck` | 14 children, 0 errors, 0 `DISCOVERY MISMATCH`. Then `npm run ward -- --only typecheck -- packages/tooling` reports 1 package |
| P9 | 5.2 | `npm run build:clean` under the split | `packages/server/dist/bin/server-entry.js`, `packages/ward/dist/bin/ward-entry.js`, the 8 hooks bins under `packages/hooks/dist/src/startup/`, and `packages/mcp/dist/src/statics/folder-constraints/*.md` all exist; the step 0 "no test code published" test is green |
| P10 | 6 | After the 3A edit: `npm run ward -- --only unit -- packages/shared/src/statics/session-snippet` | the 2048 cap holds for `wardDiscipline` |
| P11 | 7 | `createWorktree({ name: 'probe' })` on this repo, then a python walk over `worktrees/probe/node_modules` listing every symlink and its target | every target relative and inside the worktree (the scroll measured 86 and 0); `readlink -f worktrees/probe/node_modules/.bin/dungeonmaster-ward` lands under `worktrees/probe/packages/ward` |
| P12 | 7 | In the probe worktree, with no build: `npm run ward -- -- packages/config` | exit 0 |
| P13 | 7 | With the hook block in place, ask a scratch Claude Code session in this repo to enter a worktree | it is refused. Note whether the model's transcript shows the hook's stderr. If it does not, 3B change 5 is the only signal and must land before the hook block ships |
| P14 | 7d | In a testbed with no `ward` key in `.dungeonmaster.json`: `configResolveBroker({ filePath: <root>/package.json })` | returns `ward.concurrency` = 4 |
| P15 | 7 | G15: a python walk over `node_modules/*/package.json` and `node_modules/@*/*/package.json` for `postinstall` and `prepare` scripts, plus a check for a `patches/` directory at the root | nothing writes in place inside `node_modules` after install. If something does, hardlinking shares that write across trees and the seed must exclude it |
| P16 | 5.2 | Read `packages/web/tsconfig.test.json` (`include: ["src"]`, `jest.config.cjs:50` points ts-jest at it) and decide: fold into `tsconfig.json`, or add `test` to its `include`. Then `npm run ward -- --only unit -- packages/web/test` | web's harness tests still pass |

---

## 1. What the surveys changed about Section J

These eleven findings change what the steps contain. Each one is expanded in the step it belongs to.

1. **The hardcoded `dist` count is not three. It is at least eight, in three different shapes.** §J4 step 3 names
   three. The surveys found three more in `packages/testing` alone, one in `packages/mcp`, and one in
   `packages/web`. They also found four test harnesses that spawn a child process with no `--conditions=source`, so
   the child reads `dist` however jest resolves. Step 3 lists all of them.
2. **The proxy-mock transformer fix needs a TypeScript loader, not a path change.** Jest loads that transformer
   through plain Node `require`, which cannot load a `.ts` file. Changing `../dist/...` to `../src/...` fails at
   startup. Measured: `require('tsx/cjs')` in the transformer file plus `NODE_OPTIONS=--conditions=source` on the
   jest process works, with all tests and the AST transformer intact. D3.2 has the numbers and the one wiring rule.
3. **The jest `source` condition needs three homes, and one file it must never touch.** The root
   `jest.config.base.js` reaches 12 packages. `packages/testing/jest.config.js` spreads nothing and needs its own.
   `packages/web/jest.config.cjs` needs a merge, not a replacement. The published
   `packages/testing/jest-config-base.js` must stay as it is, because consumers install `dist` only.
4. **Every backend package overrides `noEmit: false`, and §J's move-out list omits it.** Left in `tsconfig.json`,
   ward's `--noEmit` flag still wins on the command line, but a bare `tsc -p tsconfig.json` would emit. It moves with
   the other emit fields.
5. **The `paths` map cannot be generated from `exports.source` alone.** Four packages have no `exports` block
   (`hooks`, `server`, `ward`, `web`). One has `exports` with no `source` (`eslint-plugin`). One `exports` entry is a
   bare string (`testing`'s `./jest-config-base`). The generator needs rules for each. And the map must go in this
   repo's root `tsconfig.json`, never in `packages/eslint-plugin/configs/tsconfig.json`, because every consumer's
   root config extends that file.
6. **The published-test-file defect (A6) is repo-wide, not cli's.** Measured today: `orchestrator` 1,177 test files
   in `dist` against 747 real, `hooks` 251 against 157 and it also publishes `src/`, `server` 398 against 622,
   `tooling` 52 against 28, `cli` 81 against 48. cli's own `tsconfig.build.json` excludes only `*.test.ts`, so
   deleting `tsc -b` gets cli to 32, not 0. The build config's exclude list has to cover proxy, stub, harness and
   `test/**`.
7. **Ward has no grouping code, no hashing code, and no dependency walk.** Pivot 2's grouped programs and Pivot 3's
   bundle hash are new code. The one transformer that groups tsc output by package lives in the broker Pivot 2
   deletes. Per-package `--noEmit` is the correct baseline and already exists as ward's fallback path.
8. **The orchestrator's populate broker never excluded `.vite-*`, does not seed `dist`, and does not verify.**
   §J says both implementations must "keep excluding" it. For the broker that is a new requirement. It symlinks
   every entry and links `.bin` as one absolute directory symlink, which is the cause of C6a.
9. **Riftcarver's build step is the verdict on the spiritmender repair loop.** Replacing it with a `dist` seed
   removes the thing that tells the loop a fix worked. Step 7 names the replacement verdict.
10. **The worktree symbols Pivot 5 wants are not exported, and hooks cannot reach the MCP tool.**
    `packages/orchestrator/src/index.ts` exports neither `gitWorktreeAddAdapter` nor `worktreePrepareBroker`. The
    hooks package has no MCP client, so the WorktreeCreate hook cannot "redirect to the tool". Decision D7.2
    resolves this: the hook blocks and names the tool, so hooks never needs the mechanism. mcp reaches it the way
    it reaches `run-ward` today, through a method on `StartOrchestrator`.
11. **The MCP child's working directory is pinned to the main checkout.** `discover`, `get-project-map`,
    `get-project-inventory` and the boot-time `.gitignore` read all key on `process.cwd()`. A tool that hands a
    session a worktree path hands it a tree the other MCP tools cannot see.

---

## 2. Decisions before starting

Each row is a call only the owner can make. Rows marked **Decided** are settled; implement them as written. Every
other row is a recommendation the plan assumes; follow it unless the owner says otherwise, and if a probe in 0.3
contradicts it, edit the row and say why. Change a row and the step it gates changes.

### Before step 3

| # | Question | Recommendation | Why |
|---|---|---|---|
| D3.1 | Where does the jest `source` condition go? | This repo's `jest.config.base.js`, plus `packages/testing/jest.config.js`, plus a merge into `packages/web/jest.config.cjs`. Never the published `packages/testing/jest-config-base.js`. | Consumers install `dist` only; a `source` condition there points at files not in the tarball. |
| D3.2 | Which loader closes the transformer's `dist` requires? | **Decided, and measured.** `require('tsx/cjs')` at the top of each transformer file, then require `src` paths. Ward spawns jest with `NODE_OPTIONS=--conditions=source`. | Probed on `packages/config` (`tmp/loader-probe/`): 16 of 16 tests pass with the glue requiring `packages/testing/src/**`; the AST transformer fires (a proxy-only assertion passes); with the env var the glue's own `@dungeonmaster/shared/statics` resolves to `packages/shared/statics.ts`, without it to `dist/statics.js`. One wiring rule: ts-jest requires each `astTransformers.before` entry by path on its own, so the register call must sit in every transformer file, not only in the barrel `transformers.js`. `packages/mcp/jest.config.cjs:14-31` hand-lists the transformer path and would otherwise miss it. |
| D3.3 | Is the root `jest.config.js` dead? | Delete it. | No package requires it. It defines its own transform and would silently miss the condition. |
| D3.4 | Does `eslint-plugin` gain a `source` export condition? | Yes: `"source": "./src/index.ts"`. | It is the only exports-bearing package without one. `local-eslint`'s whole suite reads `eslint-plugin/dist` until it does. |
| D3.5 | What happens to tests that spawn a built binary? | Two classes. Behaviour tests (`ward-runner`, `tooling-runner`, `cli-bin` harnesses) switch to `tsx --conditions=source` against source. One "built artifact loads" test per published package stays and says `npm run build` is its prerequisite. | Behaviour tests must not go stale-green. Artifact tests are the price of D4 and should say so. |

### Before step 4

| # | Question | Recommendation | Why |
|---|---|---|---|
| D4.1 | Which fields does the bundle-hash closure walk? | `dependencies` only. | `devDependencies` pulls `testing` into web's hash and rebuilds the bundle on every harness edit. The e2e tooling's `dist` need is a separate, always-incremental build. |
| D4.2 | Which files are hashed per package in the closure? | `src/**`, every root `*.ts` barrel, `package.json`, `tsconfig*.json`. For the UI package also `vite.config.ts`, `index.html`, `postcss.config.cjs`, `public/**`, `web-worker-stub.mjs`. Plus the root lockfile. | `shared`'s barrels live at the package root, not under `src/`. Web imports five of them at 375 sites. |
| D4.3 | What serves the bundle to Playwright? | `vite preview --outDir <hash path>` on `DUNGEONMASTER_WEB_PORT`. | The `preview` block in `vite.config.ts:57-67` already carries the same port and the same `/api` and `/ws` proxy as the dev server. Nothing new to write. |
| D4.4 | How does the hash path reach `playwright.config.ts`? | A fourth env var from ward, `DUNGEONMASTER_WEB_BUNDLE_DIR`. | Ward's only channel today is three env vars at `check-run-e2e-broker.ts:146-150`. Computing the hash inside the consumer's config puts the closure walk in every consumer. |
| D4.5 | Do `packages/web/dist` and `.ward/bundle/<hash>/` coexist? | Yes. `npm run build --workspace=@dungeonmaster/web` keeps filling `dist` for `dungeonmaster start`. Ward never reads or writes it. | The server's `web-bundle-dist-path-adapter.ts:19-22` hardcodes `dist` and takes no argument. |
| D4.6 | What TTL does a bundle get? | 7 days, as a fourth row in `e2eArtifactsStatics.artifacts`, with no port check. | Matches the `run-*.json` prune. Old hashes are never served by a live run. |

### Before step 5

| # | Question | Recommendation | Why |
|---|---|---|---|
| D5.1 | Grouped programs in the first cut? | No. Per-package `--noEmit` only. Grouping is a later speed change. | It is ward's existing fallback, it is what `web` does today, and a wrong grouping costs time not correctness. |
| D5.2 | What does the `tsconfig.build.json` exclude list hold? | `**/*.test.ts`, `**/*.test.tsx`, `**/*.proxy.ts`, `**/*.stub.ts`, `**/*.harness.ts`, `test/**`, `src/.test-tmp/**`, `src/_lint-testbed/**`. Keep `rootDir: "./"` and `bin/**` where a package has a `bin`. | Finding 6. `rootDir` and `bin` are what put `dist/bin/server-entry.js` and `dist/bin/ward-entry.js` where `prod` and the npm shims expect them. |
| D5.3 | Does the root `tsconfig.json` get `include` back? | No. Add `paths` and `baseUrl: "."`. Remove `references`, `files`, `composite`. | Ward reads per-package configs. IDEs do too. The pre-pivot `include` covered `tests/**`, which imports a deleted `v1/` directory. |
| D5.4 | Rules for the `paths` generator? | Emit one entry per `exports` subpath whose value is an object with a `source` key. Skip string values. Skip packages with no `exports`. Emit no bare-name entry for a package whose `"."` has no `source`. | Nothing imports `hooks`, `server`, `ward` or `web` by specifier. `cli` resolves `server` through `main` at runtime, not through TypeScript. |
| D5.5 | Where does the generator live? | `packages/shared`, as a transformer beside `packageBrowserTypeTransformer`, called by a small root script that rewrites the `paths` block. | mcp and tooling may want it. `packageJsonContract` types `exports` as `unknown`; the transformer narrows it. |
| D5.6 | `refs:sync` and `refs:check` after deletion? | Delete the names. Change the unknown-command exit code to 1. | Also fixes `ward list` reporting a false green in `scripts/ward-smoke-test.ts:628-629`. |
| D5.7 | Step 1: root `tsconfig.json` absent? Refusal loud? | Absent: skip, do not create. Unparseable: one stderr line, skip, exit unchanged. | Creation belongs to `dungeonmaster init`. A refusal is not a ward failure. |
| D5.8 | Step 2: where does per-package duration live? | A `durationMs` field on `projectResultContract`. Summary line unchanged. | The contract has no such field today. Adding it is the whole step. |
| D5.9 | Do `hooks` and `ward` stop publishing `src/`? | Yes. Add `"files": ["dist"]` to `server` and `tooling` too. | Otherwise the A6 fix has a second route. |

### Before step 7

| # | Question | Recommendation | Why |
|---|---|---|---|
| D7.1 | Where does the one worktree mechanism live? | It stays in `packages/orchestrator`. The seed and verify brokers are added beside the populate broker. `StartOrchestrator` gains a `createWorktree` method, and mcp calls it through an adapter, exactly as `run-ward` does today. | Once D7.2 blocks instead of redirecting, hooks never needs the mechanism. Only mcp and orchestrator call it, and mcp already reaches orchestrator through `StartOrchestrator`. No cross-package move and no new exports. **Decided: this replaces the earlier "move to shared" proposal.** |
| D7.2 | WorktreeCreate hook: delete, redirect, or block? | **Block.** The hook exits non-zero with one message: "Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`." Same shape as the pre-bash hook blocking `grep` and naming `discover`. | **Decided.** One location, one route. A session that tries Claude Code's own worktree path gets told where to go, so it never ends up with a tree in the wrong place. Checked against the Claude Code docs (`code.claude.com/docs/en/hooks.md`, `worktrees.md`): exit code 2 blocks; a bare path on stdout with exit 0 accepts; with no hook at all Claude Code creates `.claude/worktrees/<name>` on branch `worktree-<name>` and runs no install or build. The docs do not say whether the model sees the hook's stderr on refusal, so the same sentence also goes in root `CLAUDE.md` and the `start` command, where the model reads it before it tries. |
| D7.3 | What does the seed copy? | Every `packages/*/dist`, 1.57s. As a named `worktreePrepareStepStatics` step classified `git-state` (block). | Hooks, ward, cli, testing and mcp all run from `dist`. A missing seed means the main checkout was never built, which the user must fix. |
| D7.4 | A failed symlink verification? | Block. Refuse to return the path. | A worktree that grades the wrong tree reports green. Repair by dispatching into it makes it worse. |
| D7.5 | Riftcarver's verdict once the build step goes? | **Decided.** Seed `dist`, then `ward run --only typecheck` scoped to the worktree. The spiritmender loop re-runs that. | Finding 9. After Pivot 2 typecheck is the compile check the build used to be. |
| D7.6 | Do the reviewer prompts still run `npm run build` before ward? | No. The pinned step becomes `npm run ward -- --uncommitted` alone. | Ward typechecks source. The build proves nothing ward does not, except for `mcp`'s running child, which is a separate concern. |
| D7.7 | What replaces the `[BUILD]` ban? | **Decided.** A scope ladder, stated once in the `wardDiscipline` snippet and restated in every role prompt and in `CLAUDE.md`. Three rungs: (1) given specific files, run ward on those files and nothing wider: `npm run ward -- -- <files>`; (2) `npm run ward -- --uncommitted` only when reviewing a whole pass or handing a working tree back; (3) full `npm run ward` only before merging into `master`. In the orchestrator: workers stay on rung 1, reviewers run rung 2, nobody is told about worktrees yet. The `dist`/`tsc -b` rationale and every "build before ward" sentence go. Siegemaster keeps "no build under a live lane" as its own sentence. | The rule that mattered was scope, not check type. Typecheck no longer builds, so a file-scoped ward may include it. What a worker must not do is widen the scope. |
| D7.8 | `CONCURRENCY_LIMIT` source? | `.dungeonmaster.json` under a new `ward.concurrency` key, default 4. Ward gains a dependency on `@dungeonmaster/config`. | Ward reads no config today. Core count alone ignores memory, which E12 says is the real cap. |
| D7.9 | MCP tools in a worktree session? | Add an optional `root` argument to `discover`, `get-project-map` and `get-project-inventory`. Default stays `process.cwd()`. | Finding 11. Without it a sub-agent handed a worktree path searches the main checkout. |
| D7.10 | The sibling worktree at `/home/brutus-home/projects/cocc-flowrider-e2e`? | Out of scope. Leave it. Note it in the scroll. | Pivot 5 governs new worktrees. |

---

## 3. The three surfaces that tell an agent how to run ward

Three places tell an agent what ward is for and when to run it. They have different readers, so they must say
different things. Today all three say "build first", and two of them argue with each other. After the pivots each
one says only what its readers need. This section is written for the session that implements step 6, which will not
have read the surveys. Every "after" text below is the text to write, not a description of it.

**Who reads what.**

| Surface | Delivered by | Read by | Ships to consumer repos? | May name this repo? | May name a role? |
|---|---|---|---|---|---|
| **A. Session snippets** | `dungeonmaster-session-snippet` hook, on `SessionStart` and `SubagentStart` (`packages/hooks/src/transformers/dungeonmaster-hooks-creator/dungeonmaster-hooks-creator-transformer.ts:51-60`) | Every session and every sub-agent, in this repo and in every repo `dungeonmaster init` touched. Whether the sub-agent was launched by an orchestrator role or by a raw Claude session makes no difference | **Yes** | **No** | No. One pointer to "your Operating Rules" is the limit |
| **B. Root `CLAUDE.md`** | Claude Code, from the repo root | Every session and every sub-agent launched in this repo. Same audience as A, minus consumers | No | **Yes** | No |
| **C. Orchestrator role prompts** | `get-agent-prompt` and the work-item brief (`packages/orchestrator/src/statics/*-prompt/`, `*-reviewer/`, `*-stress/`, `*-verifier/`) | Only the role being dispatched, plus the sub-agents that role briefs. These readers also get A and B | Yes, as prompt text inside the package | No | **Yes** |

**The rule between them.** A states the ladder once, for any repo. B adds this repo's specifics and says what needs
a build here. C picks one rung of A's ladder for one role and forbids the others. C never contradicts A. B never
restates A's mechanics. A never names a package, a branch, or a role. A sub-agent launched from a raw session gets A
and B only, so B has to be enough on its own to make that sub-agent stay on the files it was given.

The ladder, stated once here so the three surfaces agree:

| Rung | Command | When |
|---|---|---|
| 1. Files | `npm run ward -- -- <files>` | You were given files, or you touched a handful. Ward picks the check types. |
| 2. Working tree | `npm run ward -- --uncommitted` | You are grading a whole pass, or handing a working tree back. |
| 3. Full | `npm run ward` | Before merging into the default branch. You own every failure in it. |

Ward builds nothing on any rung. `npm run build` is a separate command with its own reasons, listed in B.

### 3A. Session snippets — `packages/shared/src/statics/session-snippet/session-snippet-statics.ts`

Two keys carry ward guidance: `ward` (the reference: check types, flags, invocations) and `wardDiscipline` (the
rules). Each is capped at 2048 bytes by `session-snippet-statics.test.ts:3,20`. Today `ward` has 10 bytes free and
`wardDiscipline` has 34.

**`ward` — no change.** Its "ALWAYS use `npm run ward`, never `npx jest`/`eslint`/`tsc`" opener stays true. Its
last line, "Whether a FULL run is yours to make green depends on your role; see ward-discipline", stays.

**`wardDiscipline` — two paragraphs change.**

Today, line 170, the paragraph that goes:

> **Build first, unpiped.** Ward resolves cross-package types through each package's `dist/`, so a stale build
> surfaces as phantom TS2339 "property X does not exist" on correct code. Run `npm run build` as its OWN command and
> confirm it exits 0 — piping it (`npm run build | tail -3 && npm run ward`) discards the exit code and feeds a
> failed build silently into ward.

After, in its place:

> **Scope ward to the job.** Given specific files, run ward on those files and nothing wider:
> `npm run ward -- -- <files>`. Run `--uncommitted` only to grade a whole working tree before you hand it back. Run a
> bare `npm run ward` only before merging into the default branch. Ward builds nothing and reads source;
> `npm run build` is a separate command and never a step before ward.

Today, the last paragraph:

> **Who owns a FULL run.** An agent working directly for the user makes `npm run ward` exit 0 and owns every failure
> in it, including ones it did not cause. An orchestrator-dispatched role is the opposite: it NEVER runs the full
> sweep — its Operating Rules override this snippet, and the dispatcher's own `run-ward` item is the regression pass.

After:

> **Who owns a FULL run.** An agent working directly for the user makes `npm run ward` exit 0 before a merge and owns
> every failure in it, including ones it did not cause. An orchestrator-dispatched role never runs the full sweep;
> its Operating Rules name its rung, and the dispatcher's own `run-ward` item is the regression pass.

The other four paragraphs ("Never `cd` into a package", "Run it in the FOREGROUND", "Run it ONCE", "A skip on a
scoped run is not a regression") stay word for word.

**Must not say:** `master`, any package name, `npm run prod`, `dungeonmaster start`, the MCP child, worktrees, or
any role name. Those belong to B or C.

**Pinned by:** `session-snippet-statics.test.ts:37-41` pins the "Build first, unpiped" opener and the piping
sentence by regex; rewrite it to pin "Scope ward to the job" and the "never a step before ward" clause. The 2048
cap at `:3,20` is measured by the test; the new paragraph is about 60 bytes longer than the old one, and the old one
plus 34 free leaves room. Confirm by running the test.

### 3B. Root `CLAUDE.md`

Read by every session and sub-agent in this repo. It may say `master`, name packages, and describe the dogfood
scripts. It must not restate A's mechanics; it already says "fix them THERE, not here" at line 151, and that
sentence stays.

**Change 1 — the "Ward Invocation Rules (MANDATORY)" section.** The paragraph at lines 151-153 lists the mechanics
the snippet owns as "build first and unpiped, never `cd` into a package, run it in the foreground...". Delete
"build first and unpiped," from that list. The rest of the paragraph stays. Then, before rule 1, add:

> **Which ward you run depends on what you were given.** The `<dungeonmaster-wardDiscipline>` snippet states the
> three rungs. In this repo they mean:
>
> | You were | Run | Not |
> |---|---|---|
> | given files, or you touched a handful | `npm run ward -- -- <files>` | `--uncommitted`, a bare `npm run ward` |
> | asked to review a whole pass, or handing your tree back to the user | `npm run ward -- --uncommitted` | a bare `npm run ward` |
> | about to merge into `master` | `npm run ward` | anything narrower |
>
> Sub-agents you dispatch are always on the first row. Tell them their files.

Rules 1 and 2 stay as written. Rule 1 ("YOU OWN EVERY FAILURE") is the third row's owner. Rule 2 ("narrow
`--only`, never widen scope") is the first row's mechanic.

**Change 2 — a "What needs a build" table.** Add it under "Common Commands", after the `Build` line at 110:

> **Ward never needs a build. These do:**
>
> | Needs `npm run build` first | Why |
> |---|---|
> | `npm run prod` | runs `packages/server/dist/bin/server-entry.js` |
> | `dungeonmaster start` in a consumer | serves `packages/web/dist` |
> | the MCP stdio child, after any change under `packages/mcp` | it loaded `packages/mcp/dist/src/index.js` at boot; rebuild, then reconnect |
> | `npm run init` | discovers `packages/*/dist/startup/start-install.js` |
> | the hook binaries, after any change under `packages/hooks` | `.claude/settings.json` points at `packages/hooks/dist` |
> | a worktree, once, at creation | the `create-worktree` tool seeds `dist` for you |
>
> Never before `npm run ward`, `npm run dev`, or any test. Those read source.

**Change 3 — the "Shared Package" section, line 102.** Today: "After modifying:
`npm run build --workspace=@dungeonmaster/shared`". After: "Ward, dev and every test read shared's source. Build it
only for a row in the table above."

**Change 4 — "Dispatching Sub-Agents".** Add one bullet: "**Every sub-agent runs ward on its own files only.**
Name the files in the brief. A sub-agent never runs `--uncommitted` or a bare `npm run ward`; those are yours, after
it returns."

**Change 5 — worktrees.** Add one paragraph, anywhere after "Runtime Configuration":

> **Worktrees come from one tool.** Call `mcp__dungeonmaster__create-worktree({ name })`. It returns a path under
> `worktrees/` with `node_modules` hardlinked, `dist` seeded, and its links verified. Claude Code's own worktree
> command is blocked in this repo and will tell you the same thing. Never assemble `git worktree add` by hand.

**Must not say:** the ladder's mechanics in A's words, or any role's rung. It says what the rungs mean here, and
who owns the third one.

**Pinned by:** nothing. No test reads root `CLAUDE.md`.

### 3C. Orchestrator role prompts — `packages/orchestrator/src/statics/`

Each role reads A and B first, then its own prompt. A role prompt picks the role's rung and forbids the others. It
does not explain why ward exists, does not mention `dist`, `tsc`, or builds, and does not repeat A's mechanics.

**The block that replaces `[BUILD]`.** Today every operator prompt carries a `[BUILD]` block that says the role runs
no build and no ward, that its reviewer runs `npm run build` then `npm run ward -- --uncommitted`, and that this
"overrides the `<dungeonmaster-ward>` and `<dungeonmaster-wardDiscipline>` snippets". It then argues from `tsc -b`
writing a shared `dist/`. After, the block is called `[WARD SCOPE]` and says, for an operator:

> **[WARD SCOPE] You run no ward yourself.** Each sub-agent you dispatch runs ward on its own files and nothing
> wider: `npm run ward -- -- <its own paths>`. Your reviewer runs `npm run ward -- --uncommitted`, once, after it has
> read everything. Nobody in this pass runs a bare `npm run ward`; the dispatcher's `run-ward` item is the
> regression pass. This is the rung the `<dungeonmaster-wardDiscipline>` snippet assigns to you; it does not
> override the snippet.

For a reviewer:

> **[WARD SCOPE] `npm run ward -- --uncommitted` is yours, once, after you have read everything.** Nobody else on
> the pass runs it. You run no bare `npm run ward`; that is the dispatcher's. You never widen a sub-agent's scoped
> run into a `--uncommitted` of your own before you have read its work.

For a sub-agent brief (the `PROVE` block inside each operator prompt, and the stress and verifier minions):

> Prove it with `npm run ward -- -- <your own paths>`. Nothing wider: no `--uncommitted`, no bare `npm run ward`,
> no `npm run build`.

**Per role, today and after.**

| Role | File | Today | After | Pinned by |
|---|---|---|---|---|
| codeweaver | `codeweaver-prompt-statics.ts:94-101` `[BUILD]`; `:153-154` NOT-YOURS rows for `npm run build` and `npm run ward, in every form`; `:512-513` brief line `no npm run build · no run-ward MCP tool · no commit · never widen the ward`; `:535-537` "typecheck is the one that builds... `tsc -b`" | `[WARD SCOPE]` operator text; NOT-YOURS rows become `npm run ward -- --uncommitted   see [WARD SCOPE]` and `npm run ward (bare)   see [WARD SCOPE]`; brief line becomes `ward on your own paths only · no --uncommitted · no bare ward · no commit`; the `tsc -b` paragraph is deleted | `codeweaver-prompt-statics.test.ts:75-85, :79, :138, :141` |
| flowrider | `flowrider-prompt-statics.ts:86-89, :136-137, :499-501, :524-526` | same treatment | `flowrider-prompt-statics.test.ts:73-80, :77, :128, :131` |
| siegemaster | `siegemaster-prompt-statics.ts:91-97, :148-149, :586-587, :600-602` | same treatment, plus keep this sentence from `:95-96` as its own line: "A build under a live lane changes what that round is measuring, and it reads the difference back as a defect." It is about lanes, not `dist`, and stays true | `siegemaster-prompt-statics.test.ts:70-80, :74, :138, :141` |
| siegemaster-stress | `siegemaster-stress-statics.ts:116-120` `[SUB-AGENT WARD]`, `:151` tool row, `:282-283` brief line | sub-agent brief text; tool row `npm run ward -- --uncommitted / bare   not yours`; brief line `ward on your own path only · no e2e · no --uncommitted` | `siegemaster-stress-statics.test.ts:107, :110` |
| siegemaster-verifier | `siegemaster-verifier-statics.ts:112-115` `[NO BUILD, YOURSELF]`, `:343-346` "Never `typecheck` — ward's typecheck is `tsc -b`" | `[NO WARD, YOURSELF]`: "You never run ward, `npx playwright` or any test yourself; a run under a live system changes what you are verifying." The `:343-346` sentence becomes the sub-agent brief text; `typecheck` is no longer excluded | `siegemaster-verifier-statics.test.ts:138` — the one test pinning the literal `tsc -b`; rewrite |
| codeweaver-reviewer | `codeweaver-reviewer-statics.ts:17-20` header comment; `:71-75` `[BUILD]`; `:214-230` "### 6. Build, then ward" with the fenced two-line block and "the two prove different things" | header comment reworded; `[WARD SCOPE]` reviewer text; section 6 becomes "### 6. Ward" with one fenced line `npm run ward -- --uncommitted` and the sentence "Run it once, in the foreground, after you have read everything" | `codeweaver-reviewer-statics.test.ts:96-105, :98, :100` |
| flowrider-reviewer | `flowrider-reviewer-statics.ts:64-67, :173-189` | same | `flowrider-reviewer-statics.test.ts:77, :79` |
| siegemaster-reviewer | `siegemaster-reviewer-statics.ts:73-75, :173-187` | same | `siegemaster-reviewer-statics.test.ts:68, :70` |
| spiritmender | `spiritmender-prompt-statics.ts:90` "Three mechanics from the snippet still apply to you: build first, pick one mode, run it once"; `:200` table row "Build error → rebuild shared" | `:90` becomes "Two mechanics from the snippet still apply to you: re-run the failing command at the rung it was run, and run it once"; `:200` becomes "Build error → the failing command was `npm run build`; fix the source it names, then re-run that command" | no test |
| warpgate | `warpgate-prompt-statics.ts:73` "build first, run it once, and never sleep-poll it" | "run it once, and never sleep-poll it" | no test |
| riftcarver | code, not prompt: `quest-run-riftcarver-broker.ts:313-350` | the build step becomes seed plus `ward run --only typecheck` (D7.5, step 7b) | broker tests |
| the dispatcher | `slash-commands-statics.ts:78` `/dumpster-launch` body; `quest-node-dispatch-loop-broker.ts:108-111` | unchanged: `run --committed` between items, bare `run` at quest close. Add one sentence to the slash-command body: "The quest-close ward is the merge rung; nothing inside a pass runs it" | `slash-commands-statics.test.ts` |

**`packages/orchestrator/CLAUDE.md`** describes the same split at `:602, :622-624, :627-631, :1183, :1554`. Rewrite
those five places to the ladder wording. No test pins them.

**Must not say:** `dist`, `tsc -b`, `npm run build` as a step, "overrides the snippet", or anything about worktrees.
Workers are not told about worktrees yet.

**Done when** a content search over `packages/orchestrator/src/statics/**` for `tsc -b`, `npm run build`,
`[BUILD]`, and `overrides the` returns nothing except siegemaster's lane sentence, and every test in the table is
green.

---

## 4. The steps

### Step 0 — write the success tests first

**Goal.** §J3 half two names five things that must newly hold. Four are testable. Write those tests before any
pivot so they measure the before and the after.

| Test | Where | Asserts |
|---|---|---|
| Stale-green demo (E4c) | `packages/ward`, integration. A testbed with two workspace packages. Append `throw new Error('PROBE')` to package A's source, do not build, run `ward --only unit` on package B's one test that imports A. | Exit 1 and the throw in the output. Today it passes green. |
| Files ward writes outside `.ward/` | `packages/ward`, integration. Snapshot every mtime under the testbed before `ward run`, diff after. | Only paths under `.ward/` changed. Today every `tsconfig.json` and `dist/` changes. |
| A consumer's tsconfig survives | `packages/ward`, integration. Testbed root `tsconfig.json` containing `//` comments and `strict: true`. Run `ward run`. | File bytes identical. Today it is overwritten with `{ "references": [...] }`. |
| No test code in published output | Root script. After `npm run build`, count `.js` files under each publishable package's `dist` whose name matches `.test.`, `.proxy.`, `.stub.`, `.harness.`, or sits under `dist/test/`. | 0 for every package with a `files` field. Today: cli 81, orchestrator 1,177, hooks 251, server 398, tooling 52. |

The fifth item, "`dungeonmaster init` unchanged", is covered by `packages/cli/src/startup/start-install.integration.test.ts:32-34` already.

**Done when** all four tests exist, all four fail today, and each is named in the step that turns it green.

---

### Step 1 — stop the consumer damage

**Goal.** Ward never writes a `tsconfig.json` it could not parse.

| File | Change |
|---|---|
| `packages/ward/src/brokers/project-references/sync/read-tsconfig-safe-layer-broker.ts:17-28` | Return a discriminated result: `missing`, `unparseable`, or the parsed config. Today both failures collapse to `undefined`. |
| `packages/ward/src/brokers/project-references/sync/project-references-sync-broker.ts:79-89` | Between lines 83 and 84: when the root read was `unparseable`, print one stderr line and do not push the root pair. When `missing`, do not create it (D5.7). |
| `.../project-references-sync-broker.ts:72-74` | Same guard for a package pair. Unreachable today because `workspace-input-build-layer-broker.ts:28-32` gates on parse success, but the fallback is the same shape. |
| `.../project-references-sync-broker.test.ts` | Add the unparseable-root case. Every existing case stages a parseable root via `proxy.setupRootTsconfig` (`:13, :45, :81`), so no test covers this today. |

**Ships with.** Nothing else. One predicate, ward-internal.

**Done when** the step 0 "consumer tsconfig survives" test is green and the whole `project-references-sync-broker.test.ts` file still passes.

---

### Step 2 — per-package duration

**Goal.** Every speed decision later is argued against one package's numbers because per-package durations are
collapsed with `Math.max`.

| File | Change |
|---|---|
| `packages/ward/src/contracts/project-result/project-result-contract.ts:20-35` | Add `durationMs`. The contract has no duration field at all today. Update the stub. |
| `packages/ward/src/brokers/command/run/command-run-layer-multi-broker.ts:209` | Stop collapsing. Carry each child's duration onto its project result. Keep the check-level `durationMs` on `checkResultContract` (`check-result-contract.ts:15-20`) as the wall clock. |
| `resultToDetailJsonTransformer` | Surface the per-package number in `detail --json`. Summary line unchanged (D5.8). |

**Ships with.** Nothing else.

**Done when** `ward detail <id> --json` shows a duration per package per check.

---

### Step 3 — Pivot 1, jest half, and every hardcoded `dist` path

**Goal.** Jest resolves `@dungeonmaster/*` to source, and nothing on jest's transform path reads `dist`. This is
the step that turns the stale-green test green.

**3a. The `source` condition** (D3.1, D3.3)

| File | Change |
|---|---|
| `jest.config.base.js` (root) | Add `testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] }`. The file has no `testEnvironmentOptions` today. |
| `packages/testing/jest.config.js:3-31` | Same key. This config spreads nothing, so the base edit misses it. |
| `packages/web/jest.config.cjs:14-17` | Merge: `customExportConditions: ['source', '', 'require', 'default']`, keep `url: 'http://localhost'`. The empty string is MSW's jsdom workaround (E5f). |
| `jest.config.js` (root) | Delete. |
| `packages/eslint-plugin/package.json:11-15` | Add `"source": "./src/index.ts"` to the `"."` export (D3.4). |
| `packages/testing/jest-config-base.js:19-39` | **No change.** Published to consumers. |
| `packages/cli/src/statics/jest-config-template/jest-config-template-statics.ts:12` | **No change.** It spreads the published base. |

**3b. The transformer loader** (D3.2)

| File | Change |
|---|---|
| `packages/testing/ts-jest/proxy-mock-transformer.js:1` | First line: `require('tsx/cjs');`. `tsx` is a root devDependency. It must be in this file, not only the barrel; ts-jest requires each transformer by path on its own (D3.2). |
| `packages/testing/ts-jest/harness-lifecycle-transformer.js:1` | Same first line. It requires no `src` today, but a config may list it first. |
| `packages/testing/ts-jest/transformers.js:1` | Same first line, so the barrel works when loaded alone. |
| `packages/testing/ts-jest/proxy-mock-transformer.js:17` | `require('../src/middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware')` |
| `packages/testing/ts-jest/proxy-mock-transformer.js:20` | `require('../src/contracts/typescript-program/typescript-program-contract')`. §J names only line 17. |
| `packages/testing/src/jest.setup.js:51` | `require('../src/brokers/integration-environment/cleanup-all/integration-environment-cleanup-all-broker')`. No loader needed here: this file runs inside jest's own runtime, which resolves extensionless `.ts` through `moduleFileExtensions` (measured). Remove the `try/catch` at `:47` and `:53` that hides a missing build. |
| `packages/mcp/jest.config.cjs:14-31` | Use the shared `transformers.js` list instead of requiring `proxy-mock-transformer.js` directly. With the register call in every transformer file this is hygiene, not a blocker. |
| `packages/ward/src/brokers/check-run/unit/check-run-unit-broker.ts` | Spawn jest with `NODE_OPTIONS=--conditions=source` so the transformer's own `@dungeonmaster/shared/statics` import (`import-path-resolver-middleware.ts:12`) reaches source. Same in the integration broker. Without it the glue resolves that import to `dist/statics.js` (measured). |
| `tmp/loader-probe/` | The probe's files: a working `jest.config.cjs`, patched copies of the three glue files and `jest.setup.js`. Copy from them. Delete the directory when 3b lands. |

**3c. Depth-coupled path walks**

| File | Change |
|---|---|
| `packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.ts:78` | Seven `..` from `__dirname` lands on the repo root only from `dist/src/...`. From `src/...` it lands one directory above the repo. Replace with an upward search for the root `package.json` with `workspaces`. Blast radius: 66 importers, about 40 of which pass `testbed.dungeonmasterPath` into an install flow. Must land before or with 3a. |
| `packages/mcp/src/adapters/shared-package/resolve/shared-package-resolve-adapter.ts:17-21` | `dirname(dirname(require.resolve('@dungeonmaster/shared/contracts')))` overshoots to `packages/` once that export is `./contracts.ts` at the package root. Resolve `@dungeonmaster/shared/package.json` instead. Already exposed today through `start-server.sh`'s `tsx --conditions=source`. |

**3d. The web jest config**

| File | Change |
|---|---|
| `packages/web/jest.config.cjs:22` | `.../packages/testing/src/startup/start-endpoint-mock-setup.ts`. The source file's own docblock at line 6 already prescribes this. |
| `packages/web/jest.config.cjs:43` | `transformIgnorePatterns` must let ts-jest transform that `.ts` setup file. |

**3e. Spawned children with no `--conditions=source`**

| File | Change |
|---|---|
| `packages/hooks/test/harnesses/hook-runner/hook-runner.harness.ts:54,81` | `spawnSync('npx', ['tsx', '--conditions=source', hookPath])` |
| `packages/hooks/test/harnesses/hook-runner/hook-persistent-runner.harness.ts:70` | Same. |
| `packages/mcp/test/harnesses/mcp-server/mcp-server.harness.ts:84` | Same. The 1,926-line `mcp-server-flow.integration.test.ts` grades `dist` until this lands. |

**3f. Harnesses that spawn a built binary** (D3.5)

| File | Change |
|---|---|
| `packages/ward/test/harnesses/ward-runner/ward-runner.harness.ts:19-21` | Spawn `tsx --conditions=source src/startup/start-ward.ts` instead of `dist/src/startup/start-ward.js`. |
| `packages/tooling/test/harnesses/tooling-runner/tooling-runner.harness.ts:22-24` | Spawn `tsx src/index.ts`, which is already the package's own `detect-duplicates` script. |
| `packages/cli/test/harnesses/cli-bin/cli-bin.harness.ts:22` | Spawn `tsx --conditions=source bin/cli-entry.ts`. |
| `packages/ward/src/startup/start-ward.integration.test.ts:101` | Keep `wardBinExists()` as the one "built artifact exists" assertion. Add a comment naming `npm run build` as its prerequisite. |
| `packages/eslint-plugin/src/module-loads.integration.test.ts:29-36` | Keep. Same comment. |
| `packages/cli/bin/cli-entry.integration.test.ts:18,22` | Keep `binExists` and `binIsExecutable`. Same comment. |

**3g. Dead rules left behind.** `transformIgnorePatterns: ['/dist/', ...]` in every package jest config stops
matching anything. Leave them; they are harmless. `packages/ward/jest.config.js:8`'s transform key is
`'^.+\\.[jt]s$'` with no `tsx`; unchanged, ward has no `.tsx`.

**Ships with.** 3a through 3e in one commit. 3c must not trail 3a. 3f can follow.

**Done when** the step 0 stale-green test is green, every package's unit and integration suites pass under
`ward --only unit,integration`, and `discover` still scopes to `packages/shared` when the MCP server runs under
`start-server.sh`.

---

### Step 4 — Pivot 3, the hashed e2e bundle

**Goal.** Ward builds the UI bundle once per input hash, serves it read-only, and never rewrites a directory a run
is using.

**4a. New code in ward**

| Piece | Where | Notes |
|---|---|---|
| A hash adapter | `packages/ward/src/adapters/crypto/...` | Ward has no `crypto` use today. SHA-256 over file contents, sorted paths. |
| A closure-walk transformer | `packages/shared/src/transformers/...` beside `dependencyGraphAdjacencyBuildTransformer` | That transformer builds direct edges only. This one follows `dependencies` (D4.1) transitively across workspace packages. Do not reuse `packageJsonDependencyNamesTransformer`; it unions three fields. |
| A bundle-inputs transformer | `packages/ward/src/transformers/...` | The file list per D4.2. |
| A bundle-build broker | `packages/ward/src/brokers/bundle/...` | Compute hash. If `<pkg>/.ward/bundle/<hash>/` exists, return it. Else run the package's `build` script with `outDir` pointed at `<pkg>/.ward/bundle/.tmp-<pid>/`, then `rename` to `<hash>/`. If the rename loses to a sibling, delete the temp copy and use the winner. Never write into an existing `<hash>/`. |
| A fourth artifact row | `packages/ward/src/statics/e2e-artifacts/e2e-artifacts-statics.ts:28-55` | `parentDir: '.ward/bundle'`, 7-day TTL, no port check (D4.6). |
| Env var | `packages/ward/src/brokers/check-run/e2e/check-run-e2e-broker.ts:146-150` | Add `DUNGEONMASTER_WEB_BUNDLE_DIR` beside the two ports and the report name (D4.4). |
| Which packages get a bundle | `check-run-e2e-broker.ts:56` | The existing `architecturePackageE2eEligibleDetectBroker({ packageRoot })` call. It reads `src/` and `src/adapters/` directory names and `package.json`. No package name. Unchanged. |

**4b. The web package**

| File | Change |
|---|---|
| `packages/web/playwright.config.ts:102-121` | The second `webServer` entry becomes `vite preview --outDir "$DUNGEONMASTER_WEB_BUNDLE_DIR"` on `WEB_PORT` (D4.3). Keep `reuseExistingServer: false`. |
| `packages/web/vite.config.ts:73-78` | `build.outDir` stays `'dist'` for `npm run build`. The bundle broker overrides it on the command line. Do not set `emptyOutDir`; each temp directory is unique so emptying it is harmless. |
| `packages/web/test/siege-driver/siege-lane.ts:118` | **No change.** It still spawns `npm run dev --workspace=@dungeonmaster/web`. Pivot 3 replaces the dev server for e2e only. |
| `packages/testing/CLAUDE.md:66` | "Chromium running the real React app via Vite dev server" becomes "via a prebuilt bundle served by `vite preview`". |

**4c. The residual `dist` the e2e tooling needs.** Playwright's config loader and its spec transform use plain Node
`require` with no conditions, so `playwright.config.ts:4` and every harness reach `packages/shared/dist` and
`packages/testing/dist` (E5a). §J accepts this as the one write ward still does, at 1.9s each, incremental.

One probe is worth running before accepting that: Playwright's TypeScript transform and Vite's esbuild config
bundler both honour `compilerOptions.paths`. If step 5's `paths` map makes them resolve `@dungeonmaster/shared/*`
to source, G12 closes and the residual write disappears. That is probe P7 in section 0.3, run in step 5.2. Until
then, build `shared` and `testing` incrementally before an e2e run and say so in the e2e broker.

**4d. Two root files with a hardcoded package name**

| File | Change |
|---|---|
| `scripts/prune-vite-caches.mjs:26` | `WEB_CACHE_PARENT = 'packages/web/node_modules'`. Derive the list from `architecturePackageE2eEligibleDetectBroker` over `packages/*`, or accept it as a repo-local script and say so in its header. |
| `scripts/prune-vite-caches.mjs:27` | `.claude/worktrees` in `WORKTREE_PARENTS`. Drop it in step 7. |

**Ships with.** 4a and 4b together. 4c is a note. 4d can trail.

**Done when** a full e2e run with nothing changed builds no bundle, two concurrent e2e runs against the same hash
share one directory, and E10's 410 passing specs still pass under `vite preview`.

---

### Step 5 — Pivot 1 typecheck and lint half, then Pivot 2

**Goal.** Typecheck is per-package `--noEmit`. Ward writes nothing outside `.ward/`. Emit settings live in
`tsconfig.build.json`. This step is the largest. It lands in two commits so that neither leaves the repo unbuildable.

**5.1 — Ward stops using `tsc -b`** (works against today's tsconfigs; `references` still resolve to `dist`, so this
commit is stale-tolerant but no worse than today)

| File | Change |
|---|---|
| `packages/ward/src/brokers/command/run/command-run-broker.ts:113-154` | Delete the `preComputedTypecheck` IIFE: the sync call `:116`, the cycle warning `:121-127`, the guard `:129-136`, the "synced" stderr `:138-142`, the refs broker call `:149-152`. Typecheck becomes one child per package through `checkRunTypecheckBroker`. |
| `command-run-broker.ts:187` | `process.exitCode = 1` becomes `wardExitCodeStatics.exitCodes.failing`. |
| `packages/ward/src/brokers/command/run/command-run-layer-multi-broker.ts:83-91` | Delete `hasPreComputedTypecheck` and the `return null` that made `--only typecheck` spawn zero children. Typecheck now covers `filteredFolders` (`:60-71`) like every other check. |
| `packages/ward/src/statics/check-commands/check-commands-statics.ts:55-59` | Delete `typecheckRefs`. `typecheck` at `:50-54` is unchanged. |
| `packages/ward/src/statics/check-commands/check-commands-statics.test.ts:5` | One `toStrictEqual` over the whole object; rewrite. |
| `packages/ward/src/brokers/check-run/typecheck-refs/check-run-typecheck-refs-broker.ts` | Delete. Move `tscOutputGroupByPackageTransformer` (its only caller is `:64`) nowhere: delete it too under D5.1. Keep the file if grouping is wanted later. |
| `packages/ward/src/transformers/tsc-output-count-files-by-package/` | Already orphaned. Delete. |
| `packages/ward/src/brokers/project-references/sync/` (whole folder) | Delete. Step 1's predicate goes with it. |
| `packages/ward/src/guards/is-project-references-mode/` | Delete. |
| `packages/ward/src/responders/ward/refs/` | Delete. |
| `packages/ward/src/flows/ward/ward-flow.ts:22-28, 60-72` | Remove `refsSync`, `refsCheck`. Unknown command exits 1 (D5.6). `scripts/ward-smoke-test.ts:628-629` must change with it. |
| K8 orphans | `isTsconfigPairDriftedGuard`, `projectReferencesDeriveTransformer`, `tsconfigUpdateReferencesTransformer`, `tsconfigReferencesEqualTransformer`, `relativePathComputeTransformer`, `tsconfigSerializeStatics`, and the `tsconfig-sync-pair`, `tsconfig-reference`, `tsconfig-json-writable`, `workspace-input` contracts with stubs and tests. `fsReadJsonSyncAdapter` stays (`check-run-typecheck-broker.ts:68`). |
| `packages/ward/src/transformers/cli-args-parse/cli-args-parse-transformer.ts:106` | Reword the `--noEmit` example; the test at `:711` matches only `/Unknown flag/`. |

Verify after 5.1: `npm run ward -- --only typecheck` spawns 14 children, reports 0 of 14 `DISCOVERY MISMATCH`
(K5a), and `--only typecheck -- packages/tooling` reports one package, not 13.

**5.2 — Resolution moves to source, emit moves out** (one repo-wide commit)

Root:

| File | Change |
|---|---|
| `tsconfig.json:22-62` | Delete `references`. |
| `tsconfig.json:79` | Delete `files: []`. |
| `tsconfig.json:3` | Delete `composite: false`. |
| `tsconfig.json` | Add `baseUrl: "."` and the generated `paths` block (D5.3, D5.4). Do not add `include`. |
| `tsconfig.json:73-78` | Keep the `ts-node` block; `eslint.config.js:2` needs it. |
| `scripts/build-workspaces.mjs:14-20` | Rewrite the header. It justifies avoiding `tsc -b` by "only cli and eslint-plugin have a `tsconfig.build.json`". |
| `package.json:10` | `build:clean` stays `rm -rf packages/*/dist`. The relocated buildinfo survives a clean on purpose. |

Per package, 12 times (`cli` and `eslint-plugin` already have a build config; `web` has nothing to move):

| Package | `tsconfig.json` lines that move out | Build script line | Notes |
|---|---|---|---|
| shared | `:3-10`, `:13-17` | `package.json:66` | keep `include: ["src/**/*", "*.ts"]`; the `*.ts` glob is the 10 barrels |
| testing | `:4-11` | `package.json:41` | `postbuild` (`:42`) is a no-op, drop it |
| orchestrator | `:2-9`, `:20-31` | `package.json:26` | `postbuild` chmods `dist/startup/*.js`; keep `rootDir` so the path holds |
| server | `:3-10`, `:16-26` | `package.json:10` | build config must keep `bin/**/*` and `rootDir: "./"` or `dist/bin/server-entry.js` disappears |
| ward | `:3-10`, `:16-23` | `package.json:9` | same for `dist/bin/ward-entry.js`; `postbuild` `:10` chmods both |
| hooks | `:3-10`, `:16-23` | `package.json:16` | 8 bins under `dist/src/startup/`; exclude `src/.test-tmp/**`, `src/_lint-testbed/**` |
| mcp | `:3-10`, `:17-30` | `package.json:27` | `postbuild` (`:28`) copies `src/statics/folder-constraints/*.md` into `dist/src/statics/folder-constraints/`; keep `rootDir` or `get-folder-detail` breaks |
| config | `:2-8`, `:9-14` | `package.json:20` | the `../testing` reference is dead weight in a build config; drop it |
| tooling | `:2-11` | `package.json:19` | exclude `test/**`; the harness lives outside `src/` |
| local-eslint | `:2-14`, `:16-25` | `package.json:17` | private; the split is hygiene only |
| session-forensics | `:3-10`, `:16-23` | `package.json:7` | |
| cli | already split | already `tsc -p tsconfig.build.json` | grow `tsconfig.build.json:3-6` exclude to D5.2's list |
| eslint-plugin | already split | already | its `tsconfig.build.json:3-7` excludes three named files only; replace with D5.2's list. Drop the package-local `paths` at `tsconfig.json:15-19`. |

Every build config: `extends: "./tsconfig.json"`, the moved fields, `tsBuildInfoFile: "../.ward/build.tsbuildinfo"`
or similar under `.ward/`, and D5.2's exclude list. `noEmit: false` moves too (finding 4).

Publishing (D5.9): `hooks/package.json:25-29` and `ward/package.json:17-22` drop `src/`; `server` and `tooling`
gain `"files": ["dist"]`.

The hooks package:

| File | Change |
|---|---|
| `packages/hooks/src/transformers/ward-suggestion-message/ward-suggestion-message-transformer.ts:49-52` | The blocked-`tsc` message points at `npm run ward -- --only typecheck`. Still correct for checking. Add: "to emit, `npm run build`". Tests at `ward-suggestion-message-transformer.test.ts:96,106`, `hook-pre-bash-responder.test.ts:114`, `start-pre-bash-hook.integration.test.ts:89,104`. |
| `packages/hooks/src/guards/is-blocked-quality-command/is-blocked-quality-command-guard.ts:9-10` | **No change.** Bare `tsc` stays blocked; `npm run build` is the sanctioned emit and is not blocked. |
| `packages/hooks/src/statics/ward-timeout/ward-timeout-statics.ts:10` and `is-ward-command-guard` | Give `npm run build` the same 600s floor ward gets. A cold build is 55 to 71s against Bash's 120s default. |

**Ships with.** 5.2 is one commit: root tsconfig, 12 package splits, build scripts, `files` fields, the generator,
and the hooks message. A half-split repo has `tsc -b` following `references` into packages that no longer declare
them.

**Done when** `npm run build` exits 0 from clean; `npm run ward` exits 0; the step 0 "files outside `.ward/`" and
"no test code published" tests are green; `packages/web` still typechecks as its own program; and probes P7, P8, P9
and P16 have been run and their results written into this step.

---

### Step 6 — delete the build ban, and every sentence that asserts the old world

**Goal.** No served prompt, snippet, doc, or comment says ward builds, says typecheck is `tsc -b`, says a check
reads `dist`, says "build first", or bans building. Lands as one commit after 5.2, or the repo asserts two worlds.

**The text to write is in section 3.** 3A has the snippet paragraphs, 3B the root `CLAUDE.md` changes, 3C the
per-role blocks. This step lists every file and every pinning test. Write nothing that section 3 does not say, and
do not let the three surfaces drift into three wordings of the ladder.

**6a. Orchestrator prompt statics** (8 files carry the ban, not 5; the after-text is in 3C; the pinning tests are
listed with each)

| File | Lines | Test |
|---|---|---|
| `codeweaver-prompt-statics.ts` | `:94-101` the `[BUILD]` block, `:153-154` tool table rows, `:512-513` brief line, `:535-537` `tsc -b` sentence | `codeweaver-prompt-statics.test.ts:75-85, :79, :138, :141` |
| `flowrider-prompt-statics.ts` | `:86-89, :136-137, :499-501, :524-526` | `flowrider-prompt-statics.test.ts:73-80, :77, :128, :131` |
| `siegemaster-prompt-statics.ts` | `:91-97, :148-149, :586-587, :600-602`. Keep "a build under a live lane changes what that round is measuring" (D7.7). | `siegemaster-prompt-statics.test.ts:70-80, :74, :138, :141` |
| `siegemaster-stress-statics.ts` | `:116-120, :151, :282-283` | `siegemaster-stress-statics.test.ts:107, :110` |
| `siegemaster-verifier-statics.ts` | `:112-115, :343-346`. The only test pinning the literal `tsc -b`. | `siegemaster-verifier-statics.test.ts:138` |
| `codeweaver-reviewer-statics.ts` | `:17-20` header comment, `:71-75`, `:214-230` the "Build, then ward" step (D7.6) | `codeweaver-reviewer-statics.test.ts:96-105, :98, :100` |
| `flowrider-reviewer-statics.ts` | `:64-67, :173-189` | `flowrider-reviewer-statics.test.ts:77, :79` |
| `siegemaster-reviewer-statics.ts` | `:73-75, :173-187` | `siegemaster-reviewer-statics.test.ts:68, :70` |
| `spiritmender-prompt-statics.ts` | `:90` "build first", `:200` rebuild shared | no test |
| `warpgate-prompt-statics.ts` | `:73` "build first" | no test |

Sub-agent briefs change from `--only lint,test -- <own paths>` to `npm run ward -- -- <own paths>`, and ward
picks the checks. The `[BUILD]` block in each operator prompt becomes the scope ladder from D7.7: the worker runs
ward on its own files and nothing wider; the reviewer runs `--uncommitted`; nobody runs a full ward inside a pass.
The reviewer's pinned two-line step (`npm run build` then `npm run ward -- --uncommitted`) becomes the one ward
line.

**6b. Shared: the session snippets and the served architecture text**

| File | Lines | Constraint |
|---|---|---|
| `packages/shared/src/statics/session-snippet/session-snippet-statics.ts:170` and the last paragraph | The "**Build first, unpiped.**" paragraph and the "**Who owns a FULL run.**" paragraph. The replacement text for both is in 3A, word for word. | `session-snippet-statics.test.ts:37-41` pins the old opener by regex; rewrite it to pin "Scope ward to the job". The 2048-byte cap at `:3,20` is measured by the same test; run it. |
| `session-snippet-statics.ts:122, :129` | "Never `npx tsc`"; the typecheck row. Still true. | no change |
| `packages/shared/src/brokers/architecture/overview/architecture-overview-broker.ts:185-186` | "`require`/`import` → `dist`... they must rebuild before running." | test `:200-202` anchored regex; rewrite both |
| `architecture-overview-broker.ts:204` | The consumer tsconfig template carrying `composite`, `outDir`, `declaration`. | move those to a `tsconfig.build.json` example |
| `architecture-overview-broker.ts:213` | "Each package's `jest.config.js` spreads the published base". False today; every package spreads the root base. | fix |
| `packages/shared/CLAUDE.md:24-40, 104-106` | "Adding New Exports" omits `source`; "Rebuild the package"; "dependent packages must rebuild". | rewrite |

**6c. Ward's own docs**

| File | Lines |
|---|---|
| `packages/ward/CLAUDE.md:280-285, :295` | "Typecheck is the one check that WRITES" |
| `packages/ward/CLAUDE.md` | The ten K9 errors, plus `:10` "sequentially" (it is a pool of 4) |
| `packages/ward/MANUAL-TEST-CASES.md:9-10, :36-37, :726` | "Ward runs from `dist/`" |
| `packages/ward/src/brokers/e2e-artifacts/prune/e2e-artifacts-prune-broker.ts:3` | "Reach for this at the START"; it runs at the end |

**6d. Other packages**

| File | Lines |
|---|---|
| `packages/orchestrator/CLAUDE.md:602, :622-624, :627-631, :1183, :1554` | the reviewer builds; `tsc -b` |
| `packages/CLAUDE.md:17-20, :87, :89` | the per-package template with `outDir`, `noEmit: false`, and `"build": "tsc"`; "MUST rebuild shared" twice |
| `packages/mcp/src/brokers/architecture/testing-patterns/architecture-testing-patterns-broker.ts:963` | "Grep dist/ for stale references", served by `get-testing-patterns` |
| `packages/mcp/src/statics/universal-syntax-rules/universal-syntax-rules-statics.ts:449` | same; test `:451` is a full-value copy |
| `packages/mcp/start-server.sh:7-8` | "shared/orchestrator needs a build first" |
| `packages/hooks/src/statics/discover-suggestion-message/discover-suggestion-message-statics.ts:14` | "`discover` reaches `dist/`"; test `:10` |
| `packages/hooks/CLAUDE.md:9-10` | build → link → init (stays true; reword only) |
| `packages/cli/CLAUDE.md:35` | "requires `npm run build` first" |
| `packages/cli/src/statics/tsconfig-template/tsconfig-template-statics.ts:4` | docblock "add outDir/rootDir/composite" |
| `packages/testing/src/jest.setup.js:48, :54` | "Load from dist folder"; "might not be built yet" (gone with 3b) |
| `packages/testing/src/brokers/install-testbed/create/install-testbed-create-broker.ts:77` | "7 levels up from dist" (gone with 3c) |
| `packages/testing/src/adapters/**/*.proxy.ts:7` (seven files) | "gracefully degrades when imported from dist" |
| `packages/local-eslint/src/brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker.ts:10` | "rebuild shared first before lint" |
| `packages/local-eslint/src/transformers/location-literal-key-paths/location-literal-key-paths-transformer.ts:14` | same, and cites a `plan/` file that does not exist |
| `packages/eslint-plugin/src/module-loads.integration.test.ts:11-14` | keep; it names its prerequisite (D3.5) |

**6e. Root docs and commands**

| File | Lines | Verdict |
|---|---|---|
| `CLAUDE.md:151-153`, the Ward Invocation Rules section, `:102`, `:110`, Dispatching Sub-Agents, and a new worktree paragraph | five changes | all five are written out in 3B; apply them as written, after 6b lands |
| `CLAUDE.md:135-142, :250` | link; init; typecheck through the target repo's build script | stay true under D4 |
| `.claude/commands/start.md:70, :105, :134` | ward invocations for the orchestration agent | point at the 3B table where ward is first named; fix `:70` to `npm run ward -- --committed`; add 3B's worktree paragraph, since the hook's stderr may not reach the model |
| `playbook/smoketest-orchastrator.md:297-302` | "MUST run `npm run build` before every ward invocation" | false; delete |
| `playbook/smoketest-orchastrator.md:294-296` | "All packages run from `dist/`" about the dev server | already false; fix |
| `playbook/smoketest-orchastrator.md:314-320, :127-128, :369-370` | build before prod | stay true |
| `playbook/smoketest-orchastrator.md:835, :881, :945` | reviewer builds | drop the build half |
| `playbook/regression-through-e2e.md:225-229` | "Build before ward" | false; delete. Reached by `/regression` |
| `playbook/e2e-flakiness.md:245-252` | "Fix → build → unit → focused e2e" | drop the build |
| `playbook/smoketest-instances.md:172-173` | build before ward | false; delete |
| `playbook/smoketest-mcp-*.md` | build kills the MCP child | stay true |
| `docs/quest-role-paths.md:21, :99, :173` | riftcarver preflight build; reviewer build | update with step 7 |
| `.claude/commands/quest-forensics.md:205` | the build ban as the worked example | replace the example |
| `.claude/skills/ink-setup/PACKAGE-CONFIG.md:14, :38, :58-61` | package template with `noEmit: false` | update to the split |

**Done when** a repo-wide content search for `tsc -b`, `build first`, `Build first`, `[BUILD]`, and
`rebuild before` returns hits only in `scrolls/` and in git history.

---

### Step 7 — Pivots 4 and 5, plus `CONCURRENCY_LIMIT`

**Goal.** One worktree mechanism, callable from an MCP tool and from the orchestrator, producing a hardlinked,
seeded, verified worktree at `<repoRoot>/worktrees/<name>`. Every other route is blocked and names the tool.

**7a. The mechanism stays in orchestrator** (D7.1)

| Piece | Where | Change |
|---|---|---|
| `gitWorktreeAddAdapter` | `packages/orchestrator/src/adapters/git/worktree-add/git-worktree-add-adapter.ts:37-62` | Unchanged. Still the only place that assembles `git worktree add`. |
| `worktreePrepareBroker` | `packages/orchestrator/src/brokers/worktree/prepare/worktree-prepare-broker.ts:56` | Gains the two new steps below. |
| `worktreePrepareStepStatics` | `packages/orchestrator/.../worktree-prepare-step-statics.ts:27-39` | Add `seed-dist` and `verify-links`, both classified `git-state` (D7.3, D7.4). |
| New: `worktreeSeedDistBroker` | `packages/orchestrator/src/brokers/worktree/seed-dist/` | `cp -a` every `packages/*/dist` from the main checkout. Copy, never hardlink; compilers truncate-write the same inode. |
| New: `worktreeVerifyLinksBroker` | `packages/orchestrator/src/brokers/worktree/verify-links/` | Walk `node_modules`; every symlink target is relative and resolves inside the worktree. Refuse otherwise. |
| New: `StartOrchestrator.createWorktree({ name })` | `packages/orchestrator/src/startup/start-orchestrator.ts` | Runs prepare, populate, seed, verify. Returns the path. Idempotent: an existing `worktrees/<name>` is verified and returned. This is the one entry point; `run-riftcarver` calls it too. |
| New: `dist` as a location constant | `packages/shared/src/statics/locations/locations-statics.ts` | The seed and the buildinfo path both need the literal; the lint rule wants it here. |

Populate broker changes, in `populate-one-root-layer-broker.ts`:

| Lines | Today | After |
|---|---|---|
| `:96-101` | `.bin` and every non-`@` entry become one absolute symlink | `cp -al` the entry. `.bin` becomes a real directory of relative shims, so the worktree runs its own ward, hooks and CLI. |
| `:89-101` | no exclusion | skip `.vite-*` |
| `:103-130` | `@`-scope directories made real; relative targets written verbatim | unchanged. This is trap 2's fix and it already works. |

Also `tmp/pm-worktree-setup.sh`: delete once the seed and verify brokers exist. It hardcodes this checkout's
absolute root at `:6`.

**7b. Callers, and the one route that is blocked**

| Caller | File | Change |
|---|---|---|
| Orchestrator, riftcarver | `packages/orchestrator/src/brokers/quest/run-riftcarver/quest-run-riftcarver-broker.ts:229, :304, :313-350` | Call `createWorktree`. Replace the build step (`buildUntilGreenBroker` at `:336`) with `ward run --only typecheck` scoped to the worktree (D7.5). The comment at `:20-23` about the build being the repair verdict moves to the typecheck step. |
| MCP, the new tool | `packages/mcp` | One tool, `create-worktree`, input `{ name }`, output `{ path }`. It calls `StartOrchestrator.createWorktree` through `adapters/orchestrator/create-worktree/`, the same shape as `orchestrator-run-ward-adapter.ts:21`. Registration follows the `reset-flow-signoffs` template: `packages/shared/src/statics/mcp-tools/mcp-tools-statics.ts:17-44`; `contracts/create-worktree-input/`; `adapters/`; `responders/quest/handle/` Map entry at `quest-handle-responder.ts:47-57`; `quest-flow.ts:67-186`. Pins that fail one at a time: `settings-permissions-add-broker.test.ts` (7 copies), `install-flow.integration.test.ts`, `mcp-permissions-creator-transformer.test.ts:5` ("26 permission strings"), `mcp-tools-statics.test.ts:5-39`, `quest-flow.integration.test.ts:10,35,60,85`, `mcp-server-flow.integration.test.ts:1872` (add to `TOOLS_EXEMPT_FROM_SIZE_CAP`), orchestrator `smoketest-probe-args-statics.test.ts:7-11`, server `dispatcher-mcp-tools-statics.ts:10-19`. |
| Hooks, WorktreeCreate | `packages/hooks/src/responders/hook/worktree-create/hook-worktree-create-responder.ts` | **Block** (D7.2). The responder no longer creates anything. Drop `WORKTREE_DIR = '.claude/worktrees'` (`:13`), the own `git worktree add` (`:26-29`), `npm install` (`:31-34`), `npm run build` (`:36-39`). It writes one message to stderr, "Worktrees are created with `mcp__dungeonmaster__create-worktree({ name })`. It puts them under `worktrees/`.", and exits 2, which is the documented blocking code. Put the message in a statics file beside `ward-suggestion-message`, so the pre-bash and worktree hooks read alike. Because the docs do not promise the model sees that stderr, the same sentence is added to root `CLAUDE.md` and to `.claude/commands/start.md` in step 6e. No `WorktreeRemove` hook is registered today (`dungeonmaster-hooks-creator-transformer.ts:26,66-70` writes only `WorktreeCreate`), and with creation blocked there is nothing for one to remove. Tests at `hook-worktree-create-responder.test.ts:16, :42, :56` and the proxy are rewritten to pin the message and the exit code. The settings-contract rows, the creator-transformer rows and `package.json:11`'s bin all stay; the hook stays registered, because registration is what makes it fire. |
| MCP, search tools | `packages/mcp/src/brokers/file/scanner/file-scanner-broker.ts:50`, `responders/architecture/handle/architecture-handle-responder.ts:119,130`, `brokers/discover-ignore/init/discover-ignore-init-broker.ts:35` | Optional `root` argument on `discover`, `get-project-map`, `get-project-inventory` (D7.9). |

**7c. The rest of the `.claude/worktrees` ban**

| File | Change |
|---|---|
| `scripts/prune-vite-caches.mjs:27` | Drop `.claude/worktrees` from `WORKTREE_PARENTS` once `.claude/worktrees/tender-horizon` is removed. |
| `eslint.config.js:24-50` | Add `worktrees/**` to `ignores`. Harmless to land early. |
| `.gitignore:83` | Keep `.claude/worktrees` ignored so a stray one is never tracked. |
| `packages/shared/src/statics/list-ts-files-skip-dirs/list-ts-files-skip-dirs-statics.ts:15` | Add `.ward` and `worktrees` to `skipDirNames`. |

**7d. `CONCURRENCY_LIMIT`** (D7.8)

| File | Change |
|---|---|
| `packages/config/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts:40-56` | Add `ward.concurrency`, shaped like `orchestration.slotCount` (min, max, default). |
| `packages/config/src/statics/config-defaults/config-defaults-statics.ts:15-19` | Default 4. |
| `packages/ward/package.json` | Add `@dungeonmaster/config`. Ward reads no config today. |
| `packages/ward/src/brokers/command/run/command-run-layer-multi-broker.ts:73` | Read it once at the repo root through `configResolveBroker`. |
| `packages/testing/src/contracts/dungeonmaster-config/dungeonmaster-config-contract.ts:11` | A second, thinner contract with the same name. Rename it `testbedConfigContract` before ward gains a config read. |

**Ships with.** 7a, 7b and the hooks block in one commit. Two mechanisms existing at once voids Pivot 5's
guarantee. 7c and 7d can trail.

**Done when** `create-worktree({ name })` returns a path; `ls -la <path>/node_modules/.bin/dungeonmaster-ward` is a
relative shim into the worktree's own `packages/ward`; the verify broker reports 0 absolute and 0 escaping symlinks;
`ward run` inside the worktree exits 0 without a build; and a Claude Code `EnterWorktree` is refused with the
message naming the tool, leaving nothing under `.claude/worktrees/`.

---

## 5. Corrections owed to the scroll

Claims in §J or §K that the code contradicts. Each should be fixed in `workflow-paralellizer.md` so the next reader
does not plan against it.

| Scroll says | Code says |
|---|---|
| J4 step 3: "the three hardcoded `dist` paths" | At least eight. Finding 1 and step 3. |
| C6b:599: `jest.setup.js` needs no build | It requires `../dist/...` at `:51`, inside a `try/catch`. |
| C6b:602, J:2311: "one hardcoded `require('../dist/src/middleware/…')`" | Two in that file (`:17`, `:20`). |
| J1: the per-package move-out list | Omits `noEmit: false`. |
| J1:1710 "Ward's own install still does one thing: add `.ward/` to `.gitignore`" | Three gitignore entries and four npm scripts. K7 is right. |
| J1:1708 "`dungeonmaster init` grows nothing" — the four things listed | That is cli's quarter. Init also runs config, eslint-plugin, hooks, mcp, orchestrator (slash commands and the `worktrees/` scaffold) and ward. |
| C2: the orchestrator runs `--changed` between work items | There is no `--changed`. It is `run --committed`; the tail is bare `run`. |
| C3, E6e: both implementations must "keep excluding `.vite-*`" | The broker never excluded anything. New requirement for it. |
| Pivot 5 table: the orchestrator route "is not callable by an LLM session" | `run-riftcarver({ questId, workItemId })` is. It is callable only for a riftcarver work item, never for a named worktree. |
| Pivot 5 table: hooks "Populates `node_modules`? no" | It runs a full `npm install` then `npm run build`, synchronously, in a hook process. It does not re-point `@dungeonmaster/*`, so its worktree is trap 2 by construction. |
| Pivot 5 table: orchestrator "Seeds `dist`? no" | It builds, up to three passes. Replacing it removes the repair loop's verdict. |
| E9: `dungeonmaster-post-edit-lint` pays the per-edit eslint cost | That binary never runs. Nothing registers it. The cost is paid by `dungeonmaster-pre-edit-lint` on `PreToolUse`. |
| C6a: "8 × `dungeonmaster-*-hook`" plus two more rows | Hooks ships exactly 8 bins, none named `*-hook`. |
| K8: "five orchestrator prompt statics assert `tsc -b`... tests over the exact strings" | Eight files carry the ban. Only `siegemaster-verifier-statics.test.ts:138` pins the literal. The others pin paraphrases. |
| K8: `session-snippet-statics.ts:170` "is pinned by a regex" | The regex wildcards the `dist` clause. The 2048-byte cap is the real constraint. |
| K8 orphan list | Also `tscOutputGroupByPackageTransformer` and `tscOutputCountFilesByPackageTransformer` (already orphaned). |
| A6, J3: "79 against 50" in cli | 81 against 48 today. And only 48 are `tsc -b`'s; cli's own build emits 32 proxy, stub and harness files. |
| A6 scope | orchestrator 1,177, hooks 251 (and publishes `src/`), server 398, tooling 52. |
| E5a: "34 spec files, 20 harness files" | 102 and 28. |
| E5a: e2e needs `testing`'s `dist` because of missing exports | All three `testing` subpaths e2e imports already carry `source`. It is a loader limitation. |
| J:1861 "Five [worktrees] exist on disk right now" | Six under `worktrees/`, one under `.claude/worktrees/`, one sibling directory. |
| Pivot 3's example "if the bundled package depends on `config`" | Nothing in web's closure reaches `@dungeonmaster/config`. Only orchestrator depends on it. The name is a placeholder; say so. |
| J: `architecturePackageE2eEligibleDetectBroker` resolves "from `packageType` signals" | It never reads `packageType`. It reads `src/` and `src/adapters/` directory names and `package.json`. Same conclusion, different mechanism. |
| Pivot 3 hash inputs "the `src` of every package" | `shared`'s barrels are root-level `*.ts`. Web's `postcss.config.cjs`, `public/**`, `web-worker-stub.mjs` are outside `src/`. |
| K6: "`process.exitCode` never `process.exit()`" | True of the broker. `bin/ward-entry.ts:18` calls `process.exit(1)`. |
| K7: ward's integration test asserts `dist/bin/ward-entry.js` | It asserts `dist/src/startup/start-ward.js` (`ward-runner.harness.ts:19-21`). |
| Root `CLAUDE.md`: "See `get-architecture` for full ward usage" | That broker has no ward section. Ward usage is in the `ward` and `wardDiscipline` snippets, delivered by hooks. |
| F3: `isolatedModules` "closed off" | The transformer needs a callable `getSourceFile`, and `typescript-source-file-getter-adapter.ts:30-34` already falls back to reading the file. Untested, but softer than stated. |
| E4d: every jest invocation runs in band | `packages/testing/jest.config.js` sets neither flag. Under ward it is in band by CLI flag. |

---

## 6. Bugs found on the way

Not caused by the pivots. Each is either in a pivot's path or was surfaced by the same read.

| Bug | Where | In a pivot's path? |
|---|---|---|
| `dungeonmaster init` throws from a real `npm install` layout: `bin/cli-entry.ts:19,30` resolves the root as `../../../..`, which is `<consumer>/node_modules`, and `package-discover-broker.ts:21` scans `<consumer>/node_modules/packages`. `ENOENT`. Only `npm link` from a clone works. | `packages/cli` | No, but K7's "consumer install" row assumes it works. |
| `ward list` is not routed, and `scripts/ward-smoke-test.ts:628-629` asserts exit 0 for it, which passes via the unknown-command path. | `packages/ward` | Yes, D5.6 fixes it. |
| `.claude/commands/start.md:70` writes `npm run ward --committed`. npm swallows the flag. The sub-agent gets a full unscoped run. | root | No. Fix: `npm run ward -- --committed`. |
| `packages/cli/package.json:5,6,10,11,12` name `dist/index.js` and `dist/index.d.ts`. Neither has ever existed. | `packages/cli` | Only the generator must not read `main`. |
| `packages/mcp/MANUAL-TESTING.md:6` and `src/index.ts:5` name `dist/index.js`. The entry is `dist/src/index.js`. | `packages/mcp` | No. |
| `packages/shared/CLAUDE.md:84` documents `@dungeonmaster/shared/cwd/resolve`. No such export. | `packages/shared` | No. Same file is edited in 6b. |
| `packages/server/CLAUDE.md:67` tells the reader to run `npm run dev --workspace=@dungeonmaster/server`. Root `CLAUDE.md:111` forbids it. | `packages/server` | No. |
| `packages/server/src/responders/server/init/server-init-responder.ts:538` derives the web port as `serverPort + 1`. Ward hands out two independent free ports. The redirect can point at nothing. | `packages/server` | Yes, G22. Fix: read `DUNGEONMASTER_WEB_PORT` with the `+1` fallback, like `vite.config.ts:17`. |
| `packages/web/tsconfig.test.json:14` includes `["src"]` only; ts-jest transforms 28 harness files under `test/` against it. | `packages/web` | Step 5 should fold it into `tsconfig.json` or add `test`. |
| `packages/hooks/package.json:9` ships `dungeonmaster-post-edit-lint`, which nothing registers. `README.md:15, :148` point at a `src/pre-edit-lint/` directory that does not exist. | `packages/hooks` | No. Delete the bin or wire it. |
| `tests/mocks/create-mocks.ts:8` imports `../../v1/core/ward-validator`. No `v1/` exists. `test-interface.ts` is three dead lines. | root | Only if `include` returned (D5.3 says no). |
| `packages/testing/dist/playwright.config.js`, `dist/src/e2e-fixtures.js`, `dist/test/harnesses/` have no source. `packages/cli/dist` has 5 such files. `build:clean` is the only remover. | `packages/testing`, `packages/cli` | Step 5's rebuild from a narrower include should be preceded by `build:clean` once. |
| `packages/ward/MANUAL-TEST-CASES.md:487, :508, :524, :546` claim `packages/testing` has a `playwright.config.ts`. Only `packages/web` does. | `packages/ward` | No. |
| `packages/mcp/package.json:38, :41` declare `@dungeonmaster/eslint-plugin` and `@dungeonmaster/ward` and import neither. | `packages/mcp` | Only the tsconfig `references` they justify (`:19, :28`), which step 5 removes anyway. |
| `packages/orchestrator/CLAUDE.md` names `siegemaster-walker-statics`. No such file. | `packages/orchestrator` | No. |
| Two SERVED docs tell an agent to run `grep -r 'oldFieldName' packages/*/dist/` — `architecture-testing-patterns-broker.ts:963` (served by `get-testing-patterns`) and `universal-syntax-rules-statics.ts:449` (served by `get-syntax-rules`, pinned by a full-value test at `:451`). Bash `grep` is blocked by this repo's own `PreToolUse` hook, so both instruct an action the harness refuses. | `packages/mcp` | Yes — step 6d already edits both lines. Replace the advice, do not merely reword it. |
| `packages/eslint-plugin` publishes 1,098 test-only files despite HAVING a `tsconfig.build.json`; `packages/cli` publishes 243 for the same reason. Both excludes were written for test files and never covered `.proxy.`, `.stub.` or `.harness.`. | `packages/eslint-plugin`, `packages/cli` | Yes — D5.2's exclude list fixes both, but only if step 5.2 treats these two as unfinished rather than done. |
| `packages/mcp` and `packages/testing` have no `files` field either, so they publish their whole tree. D5.9 names only `server` and `tooling`. | `packages/mcp`, `packages/testing` | Yes — four packages need `"files"`, not two. |

---

## 7. Packages with nothing to do beyond step 5's split

`session-forensics` and `config` already resolve to source for both TypeScript and jest (root barrels plus a
`source` condition on every subpath). `local-eslint` is private and has no publish concern. `tooling` has one
harness change in step 3f. None of the four holds any old-world prose except the two `local-eslint` comments in 6d.

`web` has nothing to move in step 5. It is already Pivot 2's end state and is the whole second program, so it is
the package to verify the per-package derivation against first.

---

## 8. What J6 still leaves open

Unchanged from the scroll: the `tsc -b` cost (unmeasured, and not needed); the 304s web unit suite (417 files, an
MSW server and a network recorder start once per file); a scoped worktree's cold jest cost; an undeclared
cross-package import in a consumer without the lint rule; a suite that needs a third free port (the server bug
above is the first consumer of that decision); anything writing in place inside `node_modules` (G15, unswept);
the canary tier for an instrument change (G14). Nothing here has an owner yet. Session-forensics could measure
"builds per quest" for J3, but it counts tool calls by name only, walks one level of sub-agents, and has no
work-item join. That is a separate feature request against that package.

---

## 9. Execution log

Written by the session doing the work. Each entry records what a step measured, what the code said that this plan
got wrong, and any decision that changed. **Read this before starting a step.**

### 9.A Where this stands — read this first if you are picking the work up

**Committed on `master`**, in order:

| SHA | Step | What |
|---|---|---|
| `ba7dc4278` | 1 | Ward refuses to write a `tsconfig.json` it could not parse |
| `9910113fc` | 2 | Per-package `durationMs` instead of one `Math.max` |
| `eec30778e` | 7c (part) | eslint ignores, skip-dir statics, prune-script header |
| `4c68c29f4` | — | `npm run check:published`, and section 9 of this document |
| `3e9166b2a` | — | the handoff header and the e2e baseline |
| `183a97d55` | 3 | Jest reads source — all six sub-parts |
| `4ec91e59b` | 5.1 | Ward's typecheck stops being a build; 52 files deleted |
| `bec0d9281` | — | 5.1's numbers, and the question D5.3 raised |
| `b94f23b04` | — | the composer paste bug from 9.B, fixed |
| `5857b1010` | 5.2 (1/2) | Root tsconfig drops `references`; **no `paths` map needed** |

**Steps 1, 2, 3, 5.1 and part of 7c are DONE**, plus half of 5.2. Remaining: 4, the twelve package splits in
5.2, 6, and the rest of 7.

**E2e is now 102 of 102**, confirmed by two independent runs — the fixing agent's `1788750577008-4f75` and a
separate coordinator run. The composer bug in 9.B is closed.

**One test is red on `master`**, and it is more interesting than it looks — see 9.15.

**Landed in the working tree, NOT yet committed.** All of step 3, every sub-part, each verified by a scoped ward:

| Part | What landed |
|---|---|
| 3a | `customExportConditions: ['source', …]` in the three jest configs; root `jest.config.js` deleted; `eslint-plugin`'s `"."` export converted from a bare string to the object form with `source` |
| 3b | `require('tsx/cjs')` in all three ts-jest glue files; both `../dist/` requires in `proxy-mock-transformer.js` repointed to `../src/`; `jest.setup.js`'s try/catch deleted and its require repointed; `mcp/jest.config.cjs` switched to the shared barrel; `tsx` promoted to a real dependency of `testing` |
| 3c | Both depth-coupled path walks replaced by upward searches, each as a new layer file |
| 3d | `web/jest.config.cjs`'s MSW lifecycle setup repointed off `testing/dist` — this was 271 failures |
| 3e | The three hook/mcp harness spawns now pass `--conditions=source` |
| 3f | The three binary-spawning harnesses now run source under `tsx`; three artifact tests keep grading `dist` and say so |

Also uncommitted: the step 0 test in `check-commands-statics.test.ts`, which stays red until 5.1 deletes
`typecheckRefs`, and the two step 3 tests (`module-resolution.integration.test.ts`,
`transform-path-sources.integration.test.ts`).

**Why step 3 is not committed yet.** Ward cannot be green while step 5.1 is being edited in the same tree. The step 3
commit is cut from the first full sweep that comes back green.

**Order the remaining work runs in, and why:**

1. **5.1** — ward stops using `tsc -b`. Independent of step 3. In flight.
2. **A full `npm run ward`** — the real baseline, after 5.1 lands. Commit step 3 and 5.1 from it.
3. **4** and **5.2** — parallel. 5.2 is twelve package splits, one agent each.
4. **6** — the text surfaces. **Must follow 5.2**, or the repo asserts two worlds at once.
5. **7a** (in flight), then **7b**, then **7d**.

### 9.B The e2e baseline, and a failure that was already there

`npm run ward -- --only e2e -- packages/web`, run `1788748950778-6ecf`, 549s: **102 files discovered, 101 passed, 1
failed.**

`packages/web/src/flows/quest-chat/composer-paste-multiple-images.e2e.ts` — pasting the IDENTICAL clipboard item
twice renders two thumbnails (that assertion passes) but serialises one placeholder:

```
Expected: "text[Pasted Image 1][Pasted Image 2]"
Received: "text[Pasted Image 1]"
```

So the composer shows the user two images and would send one. Every byte-DISTINCT two-image case passes, which points
at something keyed on image content rather than on the paste event.

**This predates all of this work.** The spec landed 2026-09-02 and has not been edited since; nothing in step 3
touches web's paste path. **E2e has been red on `master` since then and nobody knew**, because the recent full ward
runs were killed before reaching the browser stage — including this session's first attempt. Root `CLAUDE.md` rule 1
makes it this session's to fix regardless, and it is being fixed.

**The lesson for whoever runs the next full sweep:** a ward run that dies at the e2e stage is not a green run with a
missing tail. It is a run whose slowest and least-covered check never reported.

### 9.C Dispatching rules this session learned the hard way

Section 0.2 says what to fan out. These are the mechanics of doing it, and each one cost time before it was written
down.

| Rule | Why |
|---|---|
| **Tell every sub-agent: never end your turn while a ward run of yours is unfinished.** | A backgrounded task belongs to the agent that launched it, and its completion notification goes to that agent alone — the dispatcher never sees it. An agent that starts a ward, has it cross the foreground timeout, and then ends its turn DESTROYS the verdict. Its report arrives with no result in it and the dispatcher re-runs the whole thing. **Six agents did this before the rule was written.** Tell them to keep the turn alive doing other non-conflicting work; the notification re-enters them mid-turn. |
| **Forbid `npm run build` in every agent working in parallel.** | A build rewrites every package's `dist`. Four agents building at once race each other and the loser's output is silently wrong. The dispatcher runs ONE build afterwards. |
| **Name the files each agent may NOT touch, not just the ones it owns.** | Agents read `git status`, see a dozen files changing under them, and reasonably try to help. Two agents independently root-caused and started fixing the same `shared-package-resolve-adapter` defect. |
| **Warn about dependencies BETWEEN agents' work.** | Step 3a makes jest resolve `@dungeonmaster/testing` to source, which breaks `install-testbed-create-broker` — 3c's file. Without a warning the 3a agent would have diagnosed 40 integration failures as its own. |
| **Give an agent the measurement, not the conclusion, when the plan might be wrong.** | Told to "add a `paths` map", an agent adds one. Told to "measure whether a `paths` map is needed, then act", the same agent proved it is not — and struck three decision rows. |
| **Say explicitly: do not weaken an assertion, do not raise a limit, do not add `--passWithNoTests`.** | Two agents hit a failing ceiling. Both reported it rather than raising it, and one found the ceiling had never measured its subject at all (9.15). |

### 9.0 One rule in section 0.1 could not be followed as written

Section 0.1 says: before each commit, `npm run build` exit 0, then `npm run ward` exit 0. Step 0's own done-when is
that all four success tests **fail**. Both cannot hold, so a step-0-only commit would put a red `master` in front of
the user's smoke-testing loop and every other agent for hours.

**What is done instead.** Each success test is written and RUN first, its failure output is recorded below as the
"before" measurement, and the test is then committed together with the step that turns it green. The measurement
survives; a red `master` does not happen. `scripts/check-published-output.mjs` is the exception — ward never runs it
(`scripts/**` is in eslint's `ignores` and belongs to no workspace package), so it lands immediately and stays red
until step 5.2 without reddening anything.

### 9.1 Step 0 — the four success tests, as built and as measured

The stale-green demo in section 4's step 0 table cannot be built as described. It calls for "a testbed with two
workspace packages … run `ward --only unit`", but `installTestbedCreateBroker` creates a bare directory holding a
`package.json` and `.claude/` and nothing else — no `node_modules`, no jest, no ward. A testbed cannot run ward.

The property that demo would have proved is that jest hands a test the SOURCE its author just edited. That is
directly assertable in two halves, and both halves are faster, exact, and durable:

| # | Test as built | Where | Measured today |
|---|---|---|---|
| 1a | jest resolves every `@dungeonmaster/*` import to a `.ts` source file | `packages/config/src/module-resolution.integration.test.ts` | **FAILS.** `@dungeonmaster/shared/statics` → `packages/shared/dist/statics.js`; `/contracts` and `/transformers` likewise; `@dungeonmaster/testing` → `packages/testing/dist/src/index.js` |
| 1b | nothing on jest's transform path requires compiled output | `packages/testing/src/transform-path-sources.integration.test.ts` | **FAILS** for `ts-jest/proxy-mock-transformer.js` and `src/jest.setup.js`; passes already for `transformers.js` and `harness-lifecycle-transformer.js` |
| 2 | no ward check runs a compiler in build mode | added to `packages/ward/src/statics/check-commands/check-commands-statics.test.ts` | **FAILS** — `typecheckRefs` carries `-b` |
| 3 | a consumer's root tsconfig survives, and an absent one is not created | `packages/ward/src/brokers/project-references/sync/project-references-sync-broker.integration.test.ts` | **FAILS** both cases — see 9.2 |
| 4 | no test-only code in any published `dist` | `scripts/check-published-output.mjs`, wired as `npm run check:published` | **FAILS** — see 9.3 |

Test 1a covers `jest.config.base.js`, which twelve packages spread. 1b covers the four files loaded by plain Node
`require` before ts-jest exists. D3.1's third home, `packages/web/jest.config.cjs`, gets no test of its own: web's
409 unit tests use MSW, and MSW is exactly what the `customExportConditions` merge can break, so that suite already
is the coverage.

Test 2 is derived (`Object.entries(...).filter(args includes '-b')`) rather than a second copy of the statics object,
so a check type added later is covered the day it is added.

Tests 1a, 1b and 3 sit in a `src/` root or beside a broker with no implementation sibling. Lint accepted all three —
`packages/eslint-plugin/src/module-loads.integration.test.ts` is the existing precedent.

**Test 3 dies with step 5.1**, which deletes the folder it lives in. That is correct: after 5.1 no ward code can
write a tsconfig at all, so test 2 plus the deletion is the durable guard, and test 3's job is to make step 1
provable on its own.

### 9.2 Step 1 — the consumer data loss, reproduced

Driving `projectReferencesSyncBroker` against a real testbed whose root `tsconfig.json` carries `//` comments, the
file came back as:

```
- Expected  - 7          + Received  + 4
  {
-   // Root config for this repo. Every package extends it.
-   "compilerOptions": {
-     "strict": true,
-     "target": "ES2022",
-     "paths": { "@app/*": ["./packages/*/src"] }
+   "references": [
+     { "path": "./packages/app" }
    }
  }
```

`strict`, `target` and `paths` are gone. Separately, a testbed with **no** root tsconfig had one created holding a
bare `references` array. C5 is confirmed exactly as the scroll describes it.

**How step 1 tells the two apart, which section 4 left open.** No new adapter and no existence check. `JSON.parse` is
the only thing on that path that throws `SyntaxError`, and JSONC is what `tsc --init` emits — so a caught
`SyntaxError` IS the unparseable case, and every other read failure reports as missing. The contract check moved from
`.parse` to `.safeParse`, so a file that is valid JSON of an unexpected shape also reports unparseable rather than
throwing. The result is `{status:'parsed', data}` | `{status:'unparseable'}` | `{status:'missing'}`, all three
refusing the write except the first.

`eligibleCount` had to move off `pairs.length - 1`, which assumed the root pair was always the last element. It now
reads `eligibleProjectPaths.length`, which is the same number in every case the existing tests cover.

### 9.3 Step 0 test 4 — the published-output numbers are worse than A6 says

`npm run check:published` counts `.js`, `.d.ts` and `.d.ts.map` together, so these are about 3× the scroll's
`.js`-only figures and consistent with them.

| Package | Test-only files in `dist` | Note |
|---|---|---|
| orchestrator | 3,546 | |
| shared | 2,967 | |
| server | 1,200 | **no `files` field — publishes everything** |
| mcp | 1,146 | **no `files` field** |
| eslint-plugin | 1,098 | **already has a `tsconfig.build.json`**; its exclude names three files by hand |
| ward | 861 | |
| hooks | 756 | |
| testing | 690 | **no `files` field** |
| cli | 243 | **already has a `tsconfig.build.json`**; excludes `*.test.ts` only, so proxies and stubs still ship |
| config | 171 | |
| tooling | 156 | **no `files` field** |
| web | 0 | vite builds it; nothing to fix |

Two corrections to D5.9 and to step 5.2's table. First, `mcp` and `testing` also lack a `files` field, not just
`server` and `tooling` — four packages need one, not two. Second, cli and eslint-plugin having a `tsconfig.build.json`
already does NOT mean they are done: both still publish test code, because their excludes were written for test files
only and never covered `.proxy.`, `.stub.` or `.harness.`.

### 9.4 Line numbers and claims this plan gets wrong

Read from source at `8ffc6f2f8`. Where this table and sections 4/5 disagree, this table is right.

| Plan says | Source says |
|---|---|
| `packages/web/jest.config.cjs:22` points setup at `packages/testing/dist/...` | Line 21 is already the `src` path. Line 22 is the dist one — `packages/testing/dist/src/startup/start-endpoint-mock-setup.js`. Only that line changes. |
| 3d row two: `jest.config.cjs:43` is `transformIgnorePatterns` | It is `:42-45`, and its `/dist/` entry cannot match a `packages/testing/src/**.ts` path, so once line 22 points at source this row is a **no-op**. Confirm, then drop it. |
| D3.4: add `"source": "./src/index.ts"` to eslint-plugin's `"."` export | That export is a bare **string** (`"./dist/index.js"`), not an object. Adding `source` means changing its shape, which is consumer-visible. |
| `tsconfig.json:22-62` references, `:79` files, `:3` composite | `references` is `:22-36`; `files: []` is `:51`; `composite: false` is `:3` (correct). |
| Root tsconfig `references` lists the composite packages | It omits **`mcp`** and `web`. web is deliberate; mcp looks like an oversight. |
| Step 5.1: `cli-args-parse-transformer.ts:106` mentions `--noEmit` | `:102-108`, and it is user-facing help text with no functional dependency — no change needed for 5.1. |
| D5.6 / K1: `scripts/ward-smoke-test.ts:628-629` asserts a refs command | That file contains **no** `refs` occurrence at all. Its lines 578-629 smoke-test `ward list`, which is genuinely unrouted. The `list` half of D5.6 stands; the refs half does not exist. |
| K8 orphan list | `tscOutputCountFilesByPackageTransformer` has **no caller anywhere** — already dead before this work starts. |
| Step 5.1: delete `fsReadJsonSyncAdapter`'s callers | The adapter must SURVIVE: `check-run-typecheck-broker.ts:36,68` and its proxy still use it. |
| `packages/hooks/src/statics/ward-suggestion-message/…` (7b) | No such statics file. It is a **transformer**: `packages/hooks/src/transformers/ward-suggestion-message/ward-suggestion-message-transformer.ts`. |
| Finding 10: the true compiler base is the root `tsconfig.json` | The strict flags live in `packages/eslint-plugin/configs/tsconfig.json`, which the root extends and which every consumer also extends. Step 5.2 must not move emit fields into it. |
| Section 3C's role-prompt paths | `quest-handle-responder.ts` is at its cyclomatic-complexity ceiling (50), so 7b's new tool must route through the `layerResponders` Map, not an inline `if` branch. |

### 9.5 Evidence for step 5 that came free

A scoped run — `npm run ward -- --only lint,typecheck,integration -- <one file in packages/config>` — reported
`typecheck: PASS 13 packages (6317 files passed)`. One file scoped, thirteen packages typechecked. That is K4's
"typecheck ignores the file scope in multi mode" happening in front of the implementing session, and it is the
number step 5.1's verify line must change.

The full-ward baseline at `8ffc6f2f8`: lint, typecheck, unit and integration **PASS in all 14 packages**. The e2e
half is unmeasured — the run was killed at the web e2e stage — so **the e2e baseline must be taken before step 4**,
not after it.

### 9.6 Step 6 — every pinned string, located

Read from source. Section 6a's file list is right; its line numbers are close but its account of WHICH tests pin
WHAT is not, and that is the part that decides how much work each row is.

**The ban wears four different tags, not one.** Searching for `[BUILD]` finds six of the eight files:

| Tag | Files | Says |
|---|---|---|
| `[BUILD]` | codeweaver-prompt `:94-101`, flowrider-prompt `:86-89`, siegemaster-prompt `:91-97` | "You run no build, no ward and no test of any kind" |
| `[BUILD]` | codeweaver-reviewer `:71-75`, flowrider-reviewer `:64-67`, siegemaster-reviewer `:73-75` | "`npm run build` and `npm run ward -- --uncommitted` are yours" |
| `[SUB-AGENT WARD]` | siegemaster-stress `:116-120` | same rule, different tag |
| `[NO BUILD, YOURSELF]` | siegemaster-verifier `:112-115` | same rule, different tag |

A content search for `[BUILD]` alone therefore misses two of the eight. Section 6a's "Done when" needs the other
two tags added to it.

**Which tests actually break, and which do not.**

| Pin | Kind | Breaks when you… |
|---|---|---|
| `siegemaster-verifier-statics.test.ts:138` | exact needle `` "Never `typecheck` — ward's typecheck is `tsc -b`" `` | touch that sentence. The only test pinning the literal `tsc -b`. |
| `codeweaver-reviewer-statics.test.ts:96-105` | `indexOf('npm run build') < indexOf('npm run ward -- --uncommitted')` plus needle `'npm run build\nnpm run ward -- --uncommitted'` | drop the build line from the fenced block. Same shape in flowrider-reviewer `:77,:79` and siegemaster-reviewer `:68,:70`. |
| codeweaver/flowrider/siegemaster-prompt `.test.ts` | needle `'no npm run build'` in the brief line; a second needle for the whole NOT-YOURS row including `see [BUILD]` twice | rewrite either. |
| `siegemaster-stress-statics.test.ts:110` | needle `'no typecheck · no e2e · no npm run build'` | rewrite the brief line. |
| `session-snippet-statics.test.ts:36-40` | exact anchored regex over the whole "Build first, unpiped." paragraph | rewrite 3A's first paragraph. |
| `session-snippet-statics.test.ts:16-22` | **every** non-null snippet ≤ 2048 bytes | grow `ward` or `wardDiscipline` past the cap. |
| `spiritmender-prompt-statics.ts:90`, `warpgate-prompt-statics.ts:73` | **nothing pins these** | — free edits |
| `spiritmender-prompt-statics.test.ts:257` | needle `'[WARD] Run ward scoped, in the foreground'` | change that opener. Keep it. |
| `warpgate-prompt-statics.test.ts:87,89-90` | needles for the `[WARD]` opener and "the whole-repo ward [WARD] directs" | change either. Keep both. |
| `architecture-overview-broker.test.ts:201` | loose regex — `.*` in the middle, anchored on `- **node10 resolution** (\`moduleResolution: "node"\`` … `rebuild before running.` | change either END. The middle is free. |
| `discover-suggestion-message-statics.test.ts` | whole-object `toStrictEqual` over the five-line array | change one character of it. |

**One row of 6a is wrong.** `slash-commands-statics.ts`'s `/dumpster-launch` body carries **no** build or ward prose
at all — no `[BUILD]`, no tool row, no `tsc -b`. Its only ward mention is the `run-ward` MCP call at `:78`. So there
is nothing to delete there; the plan's "add one sentence" is still possible but it is an addition, not a rewrite.

**Two claims are accurate and must NOT be rewritten** until step 5.1 actually lands: `packages/ward/CLAUDE.md:281-282`
and `check-run-typecheck-refs-broker.ts:2` describe what ward really does today.

**A bug found on the way, not in any pivot's path.** Two served docs tell an agent to run `grep -r 'oldFieldName'
packages/*/dist/` — `architecture-testing-patterns-broker.ts:963` and `universal-syntax-rules-statics.ts:449`, the
second pinned by a full-value test. Bash `grep` is blocked by this repo's own `PreToolUse` hook, so both instruct an
action the harness refuses. Add to section 6.

### 9.7 §J6's undeclared-import question is not hypothetical — this repo has five

§J6 files "what if a repo has an undeclared cross-package import?" under *Pivot 3 in a consumer repo*, and answers
that this repo is safe because it "lint-enforces that declarations are complete". **It does not.** Scanning every
`from '@dungeonmaster/…'` and `require('@dungeonmaster/…')` against each package's own declared dependencies:

| Package | Imports, undeclared | Files | Where |
|---|---|---|---|
| `testing` | `@dungeonmaster/shared` | **41** | **production source**, e.g. `src/adapters/fs/mkdir/fs-mkdir-adapter.ts` |
| `mcp` | `@dungeonmaster/testing` | 35 | proxies |
| `testing` | `@dungeonmaster/orchestrator` | 1 | a test |
| `shared` | `@dungeonmaster/orchestrator` | 1 | a test |
| `local-eslint` | `@dungeonmaster/web` | 2 | tests |

They resolve today because npm workspaces hoists every package into the root `node_modules`, so an undeclared
specifier finds its target anyway.

**What this changes.**

1. **The scroll's §J6 row is wrong and should be corrected**, not merely narrowed. The failure mode it describes for a
   stranger's repo exists here.
2. **D4.1 needs a stated position.** The bundle-hash closure walks `dependencies` transitively. Web's own closure is
   unaffected — `testing` is a devDependency and `testing → shared` is not on web's path — so the recommendation
   stands. But it stands by luck, not by a rule, and the step 4 work should say so rather than implying the graph is
   sound.
3. **`build-workspaces.mjs` derives its build order from declared dependencies**, so `testing` is ordered FIRST,
   before `shared`, while importing `shared` in 41 files. That works only because node10 resolution reaches
   `packages/shared/statics.ts` as SOURCE, compiling it inline rather than needing `shared/dist` to exist. Step 5.2
   must not break that accidental property, and P8 should confirm it.

Fixing the declarations is a separate change and is NOT in this plan's scope. Record it; do not fold it into a step.

### 9.8 A trap step 3b sets for step 5.2 — read before adding `"files"` to `testing`

Step 3b repoints `ts-jest/proxy-mock-transformer.js` at `../src/middleware/…` and `../src/contracts/…`, and adds
`require('tsx/cjs')` to all three glue files. Two consequences reach the PUBLISHED package, and neither is in
section 4:

1. **`tsx` became a runtime dependency of `@dungeonmaster/testing`**, not a dev one. The published
   `jest-config-base.js` requires `ts-jest/transformers.js`, which now requires `tsx/cjs`. Without the declaration a
   consumer's very first jest run dies at config load. It is declared, and the lockfile moved `tsx`, `esbuild`,
   `get-tsconfig` and `resolve-pkg-maps` out of dev-only accordingly. That diff is correct — do not revert it.

2. **The published transformer now reads `packages/testing/src/**` at runtime.** It works today only because
   `packages/testing` has NO `files` field, so npm packs the whole directory and `src/` ships.

   **So D5.9 and section 9.3 must NOT give `testing` a bare `"files": ["dist"]`.** Doing that removes `src/` from the
   tarball and every consumer's jest dies at transform time with a module-not-found on a path inside the package they
   just installed. If `testing` gets a `files` field at all it must list `dist`, `src`, `ts-jest` and
   `jest-config-base.js`. The other three packages named in 9.3 — `server`, `mcp`, `tooling` — carry no such
   coupling and can take `["dist"]` as written.

   The cleaner alternative, if someone wants `testing` to publish `dist` only, is to make the glue resolve `src` with
   a `dist` fallback. That is a real decision and nobody has taken it; until they do, the constraint above holds.

### 9.9 Step 3c, and what it says about D5.4's generator

Both depth-coupled path walks are replaced by upward searches rather than corrected hop counts, so neither can break
again when a module moves between `src/` and `dist/`. Each is a layer file beside its parent, because
`forbid-non-exported-functions` rules out a private nested helper and a shared walk would have to cross packages.

- `install-testbed-create-broker` now climbs from `__dirname` to the nearest ancestor whose `package.json` declares
  `workspaces`. Proven unchanged end to end: the old fixed-hop formula and the new live broker both answer
  `/home/brutus-home/projects/codex-of-consentient-craft`.
- `shared-package-resolve-adapter` climbs from the resolved `contracts` path to the nearest ancestor holding any
  `package.json`.

**The second one could not be written the way section 4 specifies, and the reason gates D5.4.**
`packages/shared/package.json` has **no `"."` export and no `main` field at all** — its `exports` map holds only the
nine folder-type subpaths. So `require.resolve('@dungeonmaster/shared/package.json')` and a bare
`require.resolve('@dungeonmaster/shared')` both throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

D5.4 already says "emit no bare-name entry for a package whose `"."` has no `source`". This confirms the rule is
load-bearing rather than defensive, and sharpens it: for `shared` there is no `"."` key **to inspect**, so the
generator must tolerate a missing `"."` and not merely a `"."` without `source`. A generator that assumes every
`exports` map has a `"."` crashes on the most-imported package in the repo.

### 9.10 `NODE_OPTIONS=--conditions=source` LEAKS to grandchildren — a hazard 3b creates

Part C of step 3b puts `NODE_OPTIONS=--conditions=source` on the jest process ward spawns, which is what the probe
measured and is correct. But `NODE_OPTIONS` is inherited by EVERY descendant, and ward's spawn adapter passes
`{...process.env}` down. So a test that itself spawns a child now hands that child source resolution too.

**Where that bites: any test that deliberately exercises COMPILED output.** `packages/cli`'s
`requireWithoutAutorun` requires the shipped esbuild bundle in a child process, to prove the bundle's
`require.main === module` auto-run guard survives bundling. Under the inherited variable, that child resolved the
bundle's externalised `require('@dungeonmaster/shared/…')` calls to `.ts` source, which plain Node cannot parse —
`ERR_MODULE_NOT_FOUND`, surfacing as `exitedCleanly: false`.

The fix is per-spawn and explicit: that one spawn sets `NODE_OPTIONS: ''`, so it measures what a real consumer of
the published bundle gets. **Any future test that spawns plain `node` against built output needs the same.** The
harness spawns do not, because they all invoke `tsx`, which reads `.ts` happily.

### 9.11 Two more depth-coupled path walks, beyond the two section 4 names

Step 3c's row lists two. There are at least four of the same shape, and step 3f hit a third:

- `packages/cli/bin/cli-entry.ts` hardcoded four `../` levels to the repo root — correct only from
  `dist/bin/cli-entry.js`. Run from source it resolved one directory too high and `runInit` died on
  `ENOENT: scandir '<parent-of-repo>/packages'`. This is the same defect section 6's first bug row already describes
  for a real `npm install` layout; running the source made it reachable from the test suite too.
- `packages/ward/test/harnesses/ward-runner`'s memory monitor polled ONE pid. `tsx` always forks a child to do the
  real work, so the monitored pid's RSS stayed flat and the 300MB ceiling was measuring nothing. It now walks
  descendant pids.

**And one plan row is simply wrong.** Section 4's 3f table says to spawn `tsx src/index.ts` for `tooling`, "which is
already the package's own `detect-duplicates` script". `packages/tooling/src/index.ts` is a re-export barrel with no
top-level call — running it exits 0 silently, having done nothing, which would have turned that harness into a test
that always passes. The real entry is `bin/detect-duplicate-primitives.ts`, the file the old
`dist/bin/detect-duplicate-primitives.js` was compiled from.

### 9.12 Step 5.1 landed, and K5a's top predicted risk did not fire

`npm run ward -- --only typecheck`, run `1788750075875-2b11`: **14 packages, 14 per-package children, 0
`DISCOVERY MISMATCH`**, every package reporting `files == discovered`. Before the change it was 13 packages from one
root `tsc -b`, printing no per-package line except `web`. §K5a ranked repo-wide `DISCOVERY MISMATCH` as the likeliest
breakage; it does not fire, exactly as the probe predicted.

52 files deleted, and a repo-wide scan for all 25 removed identifiers returns 0 dangling references.
`fs-read-json-sync-adapter` survives, as section 9.4 said it must.

Two things landed beyond the deletion, both from D5.6:

- **An unknown subcommand now exits 1.** It exited 0, so a CI job still calling `ward refs:check` after this removal
  would have got a silent pass — §K1's trap, closed.
- **`ward list` is routed.** `WardListResponder` and `commandListBroker` existed and were unit-tested, but `COMMANDS`
  had no entry, so `ward list` printed `Unknown command: list` and exited 0 — and ward's own smoke test asserted exit
  0 for it, passing through the unknown-command path. Once the exit code became 1 that smoke test would have gone red
  for the wrong reason.

**A correction to the step 0 invariant test, worth stating because it is a trap of its own.** The test derives
`Object.entries(checkCommandsStatics).filter(([, c]) => [...c.args].includes('-b'))`. Once `-b` leaves the `as const`
union that spread is a TS2345 error — so **the test only compiled while it was already failing.** A test that cannot
compile in the world it is meant to certify is not a guard. `c.args.map(String).includes('-b')` compiles in both
worlds and asserts the same thing.

### 9.13 5.1 may have removed the reason for D5.3's `paths` map — measure before building it

D5.3 and D5.4 call for a generated `paths` map in the root `tsconfig.json`, plus a generator in `packages/shared` to
produce it from each `package.json`'s `exports.source`. The premise is that removing `references` breaks cross-package
type resolution.

**That premise may already be false.** Two facts now hold at once:

1. Ward's typecheck is a per-package `tsc --noEmit`. Only `tsc -b` follows `references`; a bare `tsc` does not.
2. `npm run build` drives each package's own `build` script, which is a bare `tsc`.

So **nothing in this repo consumes a `references` array any more.** And per the architecture doc, node10 resolution
(`moduleResolution: "node"`) ignores the `exports` map entirely and resolves `@dungeonmaster/shared/contracts` to the
root-level SOURCE file `packages/shared/contracts.ts` through the workspace symlink — which would mean `references`
was never what made cross-package types resolve.

If that holds, the generator, the transformer beside `packageBrowserTypeTransformer`, and the root script that
rewrites the `paths` block are all machinery nobody needs, and D5.5 should be struck rather than implemented.

**Measured on `packages/config`. The answer is no — D5.3, D5.4 and D5.5 are STRUCK.**

| # | `references` | `packages/shared/dist` | Exit | Errors |
|---|---|---|---|---|
| 1 | present | present | 0 | none |
| 2 | **deleted** | present | 0 | none |
| 3 | **deleted** | **moved aside** | **0** | **none** |
| 4 | restored | still aside | **2** | **19**, led by 3× `TS6305` naming `packages/shared/dist/statics.d.ts` |

Row 4 is the proof, and it inverts the plan's premise: **`references` was FORCING resolution through `dist`, not
enabling it.** `--listFiles` over the same program counts 615 `.d.ts` and 0 source files from shared/testing WITH
references, and 813 source `.ts` without.

The mechanism is node10 (`moduleResolution: "node"`) ignoring the `exports` map and falling through the workspace
symlink to the root-level source barrel. `@dungeonmaster/testing` resolves differently and is already fine: it
declares `typesVersions`, which node10 DOES honour, so its subpaths map to `dist/src/*.d.ts` — unaffected by
`references`, and needing no `paths` entry either.

**`baseUrl: "."` is also struck, and this one cost a measured regression to learn.** Adding it turned
`@dungeonmaster/eslint-plugin` red with a `DISCOVERY MISMATCH`. That package declares its own
`paths: {"@dungeonmaster/eslint-plugin": ["./src/index.ts"]}` and has no local `baseUrl`; TypeScript anchors `paths`
to `baseUrl` when one is set, so a root `baseUrl` inherited through `extends` re-anchored those paths to the repo
root, `<repoRoot>/src/index.ts` does not exist, and resolution fell back to `node_modules` — dragging 23 of the
package's own `dist/**/*.d.ts` into its program. Ward's own stored results, same command nine minutes apart with the
package untouched:

| Run | `filesCount` | `discoveredCount` |
|---|---|---|
| `run-1788750076191-e7af` (before) | 593 | 593 |
| `run-1788750628645-275b` (after) | **616** | 593 |

With no `paths` at root, `baseUrl` anchors nothing — its only remaining effect was breaking the one `paths` map this
repo actually has. **Do not add it back.** If a later change genuinely needs it, the compensating fix is one line:
give `packages/eslint-plugin/tsconfig.json` its own `"baseUrl": "."`.

Root config after: `references`, `files: []` and `composite: false` gone; `ts-node` kept; no `include` added.
`npm run ward -- --only typecheck`, run `1788750805912-2d2b`: **14 packages, 7561 files, 0 errors, no mismatch.**

### 9.14 The step 5.2 split, and why the build is the coordinator's job

The twelve package splits fan out three packages per agent, on disjoint sets. **Every agent is forbidden from
running `npm run build`** — it rewrites every package's `dist`, so four agents building at once race each other.
Each verifies with ward alone; the coordinator runs ONE `npm run build:clean` afterwards, which is also P9.

Every build config takes the same exclude list (D5.2) and points `tsBuildInfoFile` at `./.ward/build.tsbuildinfo`
rather than into `dist`, so `rm -rf dist` does not throw the incremental state away.

Four packages need a `files` field they do not have — `server`, `mcp`, `tooling` take `["dist"]`. **`testing` must
NOT**, for the reason in 9.8.

### 9.15 The ward memory test has never measured a ward run

`start-ward.integration.test.ts` asserts ward's peak RSS stays under a ceiling. Its harness spawns
`tsx --conditions=source packages/ward/src/startup/start-ward.ts run --only lint`.

**`src/startup/start-ward.ts` exports `StartWard` and never calls it.** Only `packages/ward/bin/ward-entry.ts`
invokes it. So that spawn loads ward's import graph and exits — it never reaches `WardFlow`, never spawns eslint,
never runs the `--only lint` in its own arguments. Measured: zero stdout, zero eslint children, about 2s. The same
args against `bin/ward-entry.ts` fan out one eslint child per package, about 5.4s.

**This is not new.** The pre-rewrite compiled `dist/src/startup/start-ward.js` is equally barren. The ceiling has
been measuring tsx and esbuild loading a module graph, for as long as the test has existed.

Eight measurements of that barren spawn: 301652, 303460, 307388, 303936, 303792, 303032, 302796, 301652 KB — a 1.9%
spread sitting almost exactly on the old 307200 ceiling, which is why the same code passed at 19:44 and failed at
19:57.

Raising the ceiling would have made a test that asserts nothing go green. The harness is being repointed at
`bin/ward-entry.ts` and the ceiling re-derived against a subject that actually runs.
