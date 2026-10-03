# Project Guidelines

**Critical: scratch files go in `<repoRoot>/tmp`, never `~/tmp`.** `~/tmp` has permission issues and sits outside the
repo, so eslint never fires on anything in it — an eslint experiment run there proves nothing. `<repoRoot>/tmp` already
exists at the root of this repo and keeps scratch files inside both the permission scope and the linted tree. Temp dirs
that *tests* create are the exception — those belong in the OS `/tmp`, via `installTestbedCreateBroker`.

**Every rule about dungeonmaster's own operations lives in a session snippet, not in this file.** The snippets arrive
in your context at session start — yours and every sub-agent's — in this repo and in every repo `dungeonmaster init`
has touched: `<dungeonmaster-ward>`, `<dungeonmaster-wardDiscipline>`, `<dungeonmaster-buildDiscipline>`,
`<dungeonmaster-worktrees>`, `<dungeonmaster-generatedConfig>`, `<dungeonmaster-commentDiscipline>`,
`<dungeonmaster-decisionMaking>`, `<dungeonmaster-discover>`, `<dungeonmaster-searchStrategy>`,
`<dungeonmaster-folderTypes>`, `<dungeonmaster-modifyingCodeGuidance>`, `<dungeonmaster-packages>`. Their source is
`packages/shared/src/statics/session-snippet/session-snippet-statics.ts`. **Change a rule THERE.** This file holds
only what is true of THIS checkout and false of a consumer's — a copy of anything else drifts from the one the agents
actually read.

**Handoff and design docs go in `<repoRoot>/scrolls/`.** Anything written for a human or a future session to pick up —
cross-session handoffs, dogfood runbooks, design proposals, the `scrolls/design/`
prototype app — belongs there, and is committed with the repo.

**Claude Code plan mode writes to `~/.claude/plans/`, outside the repo, uncommitted.** Keep it that way. A plan-mode
plan file goes to `~/.claude/plans/`; a plan or handoff asked for "in the repo" goes to `scrolls/`.

## What This Repo Is

This is a **published npm package** (`dungeonmaster`). When users install it in their projects and run
`dungeonmaster init`, the CLI:

1. Discovers all packages in `packages/*/dist/startup/start-install.js`
2. Dynamically imports and executes each package's `StartInstall` function
3. Each package's install script sets up its own config (e.g., CLI adds devDependencies, etc.)
4. Once every package's `StartInstall` has finished, dynamically imports and executes each package's OPTIONAL
   `start-install-finalize.js` (`StartInstallFinalize`) — an after-all-installs step, for logic that must not run
   until every package's own `StartInstall` has written its part (e.g. `npm install` for a freshly scaffolded
   workspace package)

**Every consumer repo is an npm-workspaces monorepo, with packages under `packages/*`.** This is a constraint, not
a gap. Install scripts and runtime code may assume that layout. Do not add a fallback for a single-package repo.

**Important:** Each package has a `startup/start-install.ts` that gets dynamically imported at runtime. Keep install
logic directly in these startup files - don't move it to brokers (the CLI orchestration layer handles
discovery/execution).

## MCP and Agent Module Resolution Architecture

`dungeonmaster init` configures MCP for both **Claude Code** (`.mcp.json` at repo root) and **Antigravity** (`.agents/plugins/dungeonmaster/mcp_config.json`) through `dungeonmasterConfigCreatorTransformer`.

### Four Resolution Scenarios

1. **Dogfood In This Monorepo:** MCP executes THIS checkout's compiled output (`packages/mcp/dist/src/index.js`), never a globally installed npm package.
2. **Isolated Worktrees (`worktrees/<name>`):** Worktrees carved via `create-worktree` execute the worktree's own compiled output (`worktrees/<name>/packages/mcp/dist/src/index.js`) without bleeding into the root checkout or global.
3. **Consumer Repos with Local `node_modules`:** Projects initialized with `dungeonmaster init` and `npm install` resolve to `<consumerRepo>/node_modules/@dungeonmaster/mcp`.
4. **Consumer Repos with Global Install Only:** When `dungeonmaster` is installed globally (`npm install -g dungeonmaster`) and run in a repo with no local `node_modules`, MCP falls back to the global npm root (`npm root -g`).

### Resolution Precedence Rule

Local module resolution always takes precedence over global. Node's `require('@dungeonmaster/mcp')` traverses up from `process.cwd()` to find the nearest `node_modules/@dungeonmaster/mcp` (resolving the workspace symlink in this repo and worktrees, or local installed packages in consumer repos). If and only if local resolution fails, it falls back to the global npm prefix (`npm root -g`).

## Runtime Configuration

All runtime knobs (port, devCommand, buildCommand) live in `.dungeonmaster.json` at repo root. No `.env` files.

**Three scenarios:**

| Scenario                  | Launched via          | Home                                                                                 | Port source                                                                                       |
|---------------------------|-----------------------|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| Dogfood prod in this repo | `npm run prod`        | `<repo>/.dungeonmaster/` (repo-local so Claude Code Read/Grep can reach quest files) | `dungeonmaster.port` from `.dungeonmaster.json`                                                   |
| Dogfood dev in this repo  | `npm run dev`         | `<repo>/.dungeonmaster-dev/` (isolated smoke-test queue)                             | `devServer.port` from `.dungeonmaster.json`                                                       |
| End-user install          | `dungeonmaster start` | `~/.dungeonmaster` (shared user-global queue across every repo they launch from)     | `dungeonmaster.port` from their `.dungeonmaster.json`, or `environmentStatics.defaultPort` (3737) |

**Env var surface** (programmatic overrides — not set via files):

- `DUNGEONMASTER_HOME` — complete path to the dungeonmaster data dir. When unset, resolves to `~/.dungeonmaster`.
- `DUNGEONMASTER_PORT` — trumps config. Used by ward e2e (`freePortPair` from `#gateway/node/net` picks a free port per run so
  parallel e2e agents don't collide).
- `DUNGEONMASTER_WEB_PORT` — the Vite port, the second half of that same pair. **Both the Playwright config and the Vite
  config fall back to `DUNGEONMASTER_PORT + 1` when it is unset, and those two fallbacks agree only while one launcher
  picks both ports.** Ward's e2e runner asks the OS for the two independently, so it must pass this explicitly — a run
  where Playwright waits on one port and Vite binds another dies on
  `Timed out waiting 60000ms from config.webServer`.
- `DUNGEONMASTER_LOAD_DIR` — complete path to the directory where the machine load registry (`registry.sqlite3` / `registry-v1.db`) lives. When unset, resolves to `~/.dungeonmaster/load`.
- `VERBOSE=1` — gates `[dev]` orchestration event logging. Set inline by this repo's `dev` and `prod` npm scripts.
- `DUNGEONMASTER_REQUEST_LOG=1` — gates the API server's one `[http]` line per request (method, path, status,
  duration, error detail). Set only in the lane's api env in `.dungeonmaster.json`, so `npm run prod` output is
  unchanged and siegelense's `results --kind server` shows what the server did.

**Config file surface:** `.dungeonmaster.json` at repo root — ports, `devCommand`, `buildCommand`, framework, schema.
Validated by `dungeonmasterConfigContract`. A `zod.refine` rejects `dungeonmaster.port === devServer.port` (siege would
kill the parent server otherwise).

**Machine hardware configuration (`~/.dungeonmaster/config.json`):**
Hardware resource boundaries live in `~/.dungeonmaster/config.json` under `resources`:
- `maxMemoryPercent` — percentage of machine memory ward and siegelense may collectively use (default 80, bounds 10–100).
- `maxCpuPercent` — percentage of machine CPU capacity ward and siegelense may collectively target (default 75, bounds 10–90). Dungeonmaster always reserves at least 1 core for the OS and IDE.
- `maxDiskMB` — disk threshold in megabytes for cleanup / retention across dungeonmaster stores (min 1024, default 16384 / 16 GB).

Dungeonmaster automatically balances its cumulative footprint across repo stores (`.ward/run-*.json`, `.ward/bundle/*`, `test-results/*`, `node_modules/.vite-*`, `.ward-playwright-report-*.json`) and user stores (`/tmp/jest_*/*`, `/tmp/dm-e2e-*`, `/tmp/dungeonmaster-jest-*`, `/tmp/dm-siege-*`, `<dungeonmasterHome>/siegelense/**/instances/*`), deleting the oldest eligible items first. Protected items (live process PIDs, newest ward run result per repo, items <10m old, ports <24h old, symlink targets) are never deleted.

Run `npm run ward -- --prune [default|all]` to run a manual survey and eviction pass.

This is per-machine hardware configuration in the user's home directory (`os.homedir()`); `DUNGEONMASTER_HOME` does not move or override it.

**Dogfood siege case:** when siegemaster spawns `npm run dev` as a child during a quest run, npm's script-inline env
(`VAR=val cmd` via `sh -c`) overrides inherited env, so the child uses `<repo>/.dungeonmaster-dev` (not the parent's
prod home). The parent's quest queue is safe.

**Test isolation:** Playwright spins up a real `npm run dev:no-watch --workspace=@dungeonmaster/server` under
`DUNGEONMASTER_HOME=/tmp/dm-e2e-{pid}` with a fake Claude CLI. **`dev:no-watch`, never `dev` — the watcher is the
difference between a green suite and six mystery failures.** `dev` is `tsx watch --conditions=source`, and
`--conditions=source` resolves every `@dungeonmaster/*` import to TypeScript source, so the whole `packages/*/src/**`
tree sits in the watcher's module graph: ONE file save anywhere in the repo restarts the API server for ~1.5s, and
during that window Vite's `/api` proxy answers every request with a bare 500 and an empty body. That surfaces as
`SyntaxError: Unexpected end of JSON input` from a harness calling `response.json()`, as `waitForResponse` timeouts,
and as panels that never mount — six unrelated-looking specs at once, none of them actually broken. If you are
editing the repo while e2e runs (or running parallel agents that are), this is the first thing to suspect. Ward e2e
(`check-run-e2e-broker.ts`) grabs a free port pair via `freePortPair` (`#gateway/node/net`) and passes them via `DUNGEONMASTER_PORT`
and `DUNGEONMASTER_WEB_PORT`. It also names the Playwright JSON report after the server port and gives Playwright a
per-port `outputDir`, so **several browser walks against the same package can run at once**: with `ward.e2eSharding` on,
each ward e2e run starts up to 3 Playwright processes (shards), each with its own API server, Vite server and browser.
Jest integration tests use `installTestbedCreateBroker` with their own tmp dirs. Nothing touches `<repo>/.dungeonmaster`,
`<repo>/.dungeonmaster-dev`, or `~/.dungeonmaster` during tests.

**Fencing resolution to a worktree takes a `ts.resolveModuleName` host that hides paths outside it.** The
`<dungeonmaster-worktrees>` snippet says why a worktree is not hermetic; this is the mechanism that works here.

## Project Info

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks auto-reset via `@dungeonmaster/testing` - no manual cleanup needed

**Integration Tests with File System**: Use `installTestbedCreateBroker` from `@dungeonmaster/testing` for isolated temp
directories under the OS `/tmp`. Never write test files into the repo — not even `<repoRoot>/tmp`.

```typescript
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

const testbed = installTestbedCreateBroker({
  baseName: BaseNameStub({ value: 'my-test' }),
});
// testbed.guildPath - isolated temp directory in /tmp
// testbed.cleanup() - removes temp directory
```

**Shared Package**: `@dungeonmaster/shared` for code used by multiple packages

- Ward, dev and every test read shared's source. Build it only for a case the build rules below name.
- Import: `import {x} from '@dungeonmaster/shared/statics'`

**JSONL Stream Line Stubs**: Tests that construct Claude CLI JSONL shapes (assistant messages, tool results, etc.) must
use stubs from `@dungeonmaster/shared/contracts` — not raw inline JSON. See `packages/shared/CLAUDE.md` for reasoning.

### Common Commands

- **Build**: `npm run build`

Build cases the `<dungeonmaster-buildDiscipline>` snippet cannot know, because they are this checkout's:

| Before this                                | Build                                    | Why                                                                                                                                                                       |
|--------------------------------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `npm run prod`                             | the whole repo                           | runs `packages/server/dist/bin/server-entry.js`, and `vite preview` serves `packages/web/dist`                                                                             |
| lint, after a `locationsStatics` change    | `--workspace=@dungeonmaster/shared`      | `eslint.config.js` loads this repo's own rules from source, but they import `@dungeonmaster/shared/statics` at module load, and ESLint sets no `source` condition           |
| `npm run check:published`                  | `npm run build:clean`                    | it grades compiled output, and a warm tree still holds emit that no current build config would produce                                                                     |
| `npm run check:consumer`                   | `npm run build:clean`                    | it `npm pack`s every non-private package's compiled `dist/`, so a stale or absent build silently packs last build's output or nothing                                       |
| using a ward change as the tool            | `--workspace=@dungeonmaster/ward`, in the checkout that changed it | the root `ward`/`lint`/`typecheck`/`test` scripts run `node packages/ward/dist/bin/ward-entry.js`, this checkout's own build, never a globally linked ward |
| running anything in a fresh worktree       | nothing — `create-worktree` does it      | `git worktree add` checks out TRACKED files and `dist` is gitignored, so the tool `cp -a`s the main checkout's `dist` across at carve time                                 |

- **Prove a fresh consumer repo bootstraps correctly**: `npm run check:consumer` (after `npm run build:clean`).
  It builds a real, isolated consumer under the OS `/tmp` (never under this checkout — Node's `require` walk-up
  would otherwise resolve `@dungeonmaster/*` to THIS repo's own copy and fake a pass), packs and installs every
  published package's tarball, runs `dungeonmaster init` for real, scaffolds two application packages inside it
  with the consumer's own `create-package`, and asserts both what `init` wrote and that the result actually
  works (typecheck, lint, the copied gateways' own tests, the I/O trap, a mocked gateway-proxy test, the
  consumer's own build, the MCP server, `dungeonmaster ward`, the pre-edit hook, and idempotent re-init). It
  runs OUTSIDE ward (`scripts/consumer-check/**` — never a workspace package; see that script's own header for
  why) and `release` runs it after `check:published`. `--mode=local|global|all` picks which of repo CLAUDE.md's
  MCP resolution scenarios to drive; `--keep` keeps every consumer directory instead of deleting a passing one.

- **Start dev server**: `npm run dev` — **root-only.** Never `npm run dev --workspace=@dungeonmaster/<pkg>` and
  never `cd packages/<pkg> && npm run dev`. The root script is the canonical entry point: it kills stale
  instances, resolves ports from `.dungeonmaster.json`, sets `DUNGEONMASTER_HOME` and `DUNGEONMASTER_PORT`,
  runs `VERBOSE=1`, and spawns the server + web workspaces together under one wait. Running a workspace
  invocation directly skips all of that and quietly produces bugs (wrong cwd, no env vars, ports colliding
  with prod, etc.). Same rule for `npm run prod`.

## Regenerating `.claude/settings.json` Here

The `<dungeonmaster-generatedConfig>` snippet says to change the generator and re-run `dungeonmaster init`. In THIS
checkout the CLI and the install scripts are the code you just edited, so `init` alone runs the previous build:

```bash
npm run build
npm link --workspaces
npm run init
```

A consumer needs only the last step. The generator for each entry — the hooks transformer, the MCP permissions
broker — is named in the snippet's owner table.

## Which Checks Apply To A File Here

The `<dungeonmaster-wardDiscipline>` snippet says a `DISCOVERY MISMATCH` is answered by narrowing `--only`, never by
widening scope. What it cannot know is THIS repo's folder-type → check-type mapping. Contract / guard / transformer
files usually only have `unit`; flow / startup have `unit` + `integration`; `e2e` only applies to e2e-eligible
packages (`packageType` is `frontend-react` or `frontend-ink` — see `architecturePackageE2eEligibleDetectBroker` in
`@dungeonmaster/shared`), not a hardcoded package name. So the answer is
`npm run ward -- --only lint,typecheck,unit -- <files>`. Say in the commit which checks you ran and why.

## Committing

**"Commit" means commit on the branch you are already on.** Create no branch, switch to no branch. This
OVERRIDES the harness default that tells you to branch when you are on the repo's default branch —
committing straight to `master` is the norm here and is what the user means every time they say commit.

- ❌ Create `perf/some-name`, commit there, offer to merge → **NO**. That is a branch, a merge, and a
  branch deletion the user now has to ask for, for a commit they already asked for.
- ❌ "You are on `master`, so I branched first." → **NO**. This file outranks that default.
- ✅ `git add <paths> && git commit` on the current branch, then report the SHA. Done.

Branch only when the user asks for a branch in that message, or when they have said this session that
work belongs on one.

## MANDATORY: Full Ward Before Merging to Master

**NO branch or worktree may ever be merged into `master` without a full, bare `npm run ward` (unscoped, whole monorepo) exiting 0.**
- Flags like `--committed`, `--uncommitted`, or path-scoped runs (`-- <files>`) are strictly for fast iteration inside worktrees and branches.
- Scoped runs do NOT detect cross-package ripples (e.g. moving a static from one package breaks another package that imported it).
- Before ANY merge to `master`, run a bare `npm run ward` (with `timeout: 600000`). If anything fails, fix it. A merge into `master` on anything less than an exit code 0 from a full, bare `npm run ward` is strictly forbidden.
- Zero tolerance: An agent working directly for the user owns every failure in a full run, including pre-existing or cross-package breakages.

## Verification Standards

**The browser UI is the verdict, not the backend.** For any manual QA or smoketest, a run FAILS if a
UI surface broke during it — blank panel, frozen spinner, missing rows, wrong route, console errors —
**even when `quest.status` is `complete` and `smoketestResults[0].passed` is `true`.** Backend
assertions only prove the plumbing fired; they never observed the browser. Use `quest.json`, the dev
log, and the API as *diagnostics* to explain why the UI broke, never as the verdict.

**Manual QA: the UI is the lens, not the limit.** Every bug you surface through the browser is in
scope to fix, wherever it lives — widget, responder, broker, contract, transformer, fixture, spawn
adapter, MCP plumbing. There is no "secondary issue", "out of scope", "backend not UI", or "deeper
issue we can defer". If the user clicks a failed row and cannot see why it failed, that IS the bug.

**Drive the original repro yourself before handing back.** Tests-green is necessary, not sufficient.
Open the same URL, the same mode/filter, and watch the reported symptom disappear. If the user stated
a structural invariant ("one row per quest file on disk"), assert that exact ratio in a test BEFORE
writing the fix — a test that only checks per-row text is not a regression guard for row count.

## Dispatching Sub-Agents

- **1-3 files per cleanup agent, maximum.** Agents handed large batches optimise for throughput over
  correctness and invent evasions (extracting violations to variables, `[\s\S]*` wildcards) that pass
  lint without improving anything. For assertion fixes, tell the agent to run the test first, capture
  the real output, and assert on that.
- **Use `model: "sonnet"` for large mechanical fan-outs** (lint cascades, mass refactors). These can
  spawn 30-50 agents across waves; opus is overkill for apply-the-contract work. Reserve opus for the
  orchestrator and genuinely hard debugging.
- **A `fork` sub-agent starts with a full copy of the parent's conversation and runs on the parent's
  model.** It is not scoped by the instruction you hand it — it carries the parent's WHOLE task and
  acts on that, not just your prompt.
- **Never fork from an agent that is implementing or editing files.** The fork edits the same
  checkout in parallel with its parent. Measured this session (2026-09-28): an implementing agent
  (F54) forked a helper told "fetch MCP tool outputs; do not implement," and the fork re-did the
  parent's whole task instead — 129 turns and 47 file edits alongside its parent, about 52 million
  cache-read tokens against the parent's 36 million. The inherited context was a small share of that:
  a fresh agent doing the same 129 turns would have cost about 95% as much. The waste is the
  duplicate work, not the copied context. An earlier agent (SL7) had its forks redo its migration
  beside it the same way.
- **Never fork to run a side job** — "fetch these docs," "re-run the regression," "just check X." Do
  the step yourself, or have the operator dispatch a fresh agent with a short brief.
- **Never fork after a long exploration.** A fork copies the parent's WHOLE transcript, so each child
  starts at the parent's context size and only grows from there. One agent explored for 35 minutes,
  reached about 571k tokens, then forked two children; one of them finished at 863k. Write what the
  exploration found into a short note and brief a FRESH agent from it instead.
- **Fork only from a short-context parent running several parallel explorations that edit nothing** —
  the operator or orchestrator, early in its run, wants a few read-only investigations that should
  start from everything it already knows. When a child needs only a few facts, a fresh agent with a
  written brief is cheaper and cannot duplicate the parent's task.
- **A dispatched agent — anything briefed by `agent-brief.md` — never forks and never dispatches a
  sub-agent of its own.**
- **Keep an agent's own context small.**
  - Scope `discover` narrowly. A `context: 15` or `verbose: true` search returned 15k to 42k
    characters per call.
  - Never load a file through both Bash (`cat`) and `Read`.
  - A file read more than twice belongs in a note.
  - Pipe ward output through `tail`.

## Searching From a Session Launched In This Repo

This repo's `PreToolUse` hooks are **session-global** — they fire even while you are working in a
different sibling repo. Blocked session-wide: Bash `grep`/`find`/`rg`, the native Glob/Grep/Search
tools, bare `tsc`, and bare `npx eslint`. The `discover` / `get-project-map` MCP tools only see this
repo's `packages/**`, so they cannot search a sibling repo either.


## Product Framing

Dungeonmaster is a **dev tool / AI orchestrator**, not a SaaS product. The web UI is an operational
RPG-themed interface — pixel-art dungeon-raid aesthetic — not a product page. Quests in progress
animate like an RPG dungeon raid. Never use the word "marketing"; it is blacklisted.

## Orchestration Integration Tests Are Mandatory

Every orchestration role needs integration coverage of ALL paths — happy and failure/recovery — as
enumerated in `docs/quest-role-paths.md`. This has been asked for repeatedly and repeatedly claimed
without delivery, so the bar is evidentiary:

1. Never claim tests were written without running them and showing the output.
2. Tests must verify BEHAVIOUR (the callback fired with this content), not wiring (the callback was
   passed). A structural check that only proves a callback was handed over is what let the missing
   output-streaming bug ship.
3. After they pass, READ the assertions and confirm each one asserts real values — states, content,
   payloads. A test that passes while asserting "rendered" or "was called" is a false positive and is
   worse than no test.

## Iterating On Test Infrastructure

When debugging test infrastructure (e2e setup, ward display, port management), skip all but one test
so each cycle is fast, then unskip incrementally as the fix holds. Do not run the full suite until the
fix is confirmed — a full e2e run costs minutes per iteration.
