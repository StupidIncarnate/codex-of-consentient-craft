# Project Guidelines

**Critical: scratch files go in `<repoRoot>/tmp`, never `~/tmp`.** `~/tmp` has permission issues and sits outside the
repo, so eslint never fires on anything in it — an eslint experiment run there proves nothing. `<repoRoot>/tmp` already
exists at the root of this repo and keeps scratch files inside both the permission scope and the linted tree. Temp dirs
that *tests* create are the exception — those belong in the OS `/tmp`, via `installTestbedCreateBroker`.

**Every rule about dungeonmaster's own operations lives in a session snippet, not in this file.** The snippets arrive
in your context at session start — yours and every sub-agent's — in this repo and in every repo `dungeonmaster init`
has touched: `<dungeonmaster-ward>`, `<dungeonmaster-wardDiscipline>`, `<dungeonmaster-buildDiscipline>`,
`<dungeonmaster-worktrees>`, `<dungeonmaster-generatedConfig>`, `<dungeonmaster-commentDiscipline>`,
`<dungeonmaster-discover>`, `<dungeonmaster-searchStrategy>`, `<dungeonmaster-folderTypes>`,
`<dungeonmaster-modifyingCodeGuidance>`, `<dungeonmaster-packages>`. Their source is
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

**Important:** Each package has a `startup/start-install.ts` that gets dynamically imported at runtime. Keep install
logic directly in these startup files - don't move it to brokers (the CLI orchestration layer handles
discovery/execution).

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
- `DUNGEONMASTER_PORT` — trumps config. Used by ward e2e (`netFreePortPairAdapter` picks a free port per run so
  parallel e2e agents don't collide).
- `DUNGEONMASTER_WEB_PORT` — the Vite port, the second half of that same pair. **Both the Playwright config and the Vite
  config fall back to `DUNGEONMASTER_PORT + 1` when it is unset, and those two fallbacks agree only while one launcher
  picks both ports.** Ward's e2e runner asks the OS for the two independently, so it must pass this explicitly — a run
  where Playwright waits on one port and Vite binds another dies on
  `Timed out waiting 60000ms from config.webServer`.
- `VERBOSE=1` — gates `[dev]` orchestration event logging. Set inline by this repo's `dev` and `prod` npm scripts.

**Config file surface:** `.dungeonmaster.json` at repo root — ports, `devCommand`, `buildCommand`, framework, schema.
Validated by `dungeonmasterConfigContract`. A `zod.refine` rejects `dungeonmaster.port === devServer.port` (siege would
kill the parent server otherwise).

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
(`check-run-e2e-broker.ts`) grabs a free port pair via `netFreePortPairAdapter` and passes them via `DUNGEONMASTER_PORT`
and `DUNGEONMASTER_WEB_PORT`. It also names the Playwright JSON report after the server port and gives Playwright a
per-port `outputDir`, so **several browser walks against the same package can run at once** — four is a sensible cap,
since each one boots an API server, a Vite server and a browser. Jest integration tests use
`installTestbedCreateBroker` with their own tmp dirs. Nothing touches `<repo>/.dungeonmaster`,
`<repo>/.dungeonmaster-dev`, or `~/.dungeonmaster` during tests.

**Fencing resolution to a worktree takes a `ts.resolveModuleName` host that hides paths outside it.** The
`<dungeonmaster-worktrees>` snippet says why a worktree is not hermetic; this is the mechanism that works here.

See `playbook/smoke-testing.md` for manual verification steps.

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
// testbed.projectPath - isolated temp directory in /tmp
// testbed.cleanup() - removes temp directory
```

**Shared Package**: `@dungeonmaster/shared` for code used by multiple packages

- Ward, dev and every test read shared's source. Build it only for a case the build rules below name.
- Import: `import {x} from '@dungeonmaster/shared/statics'`

**JSONL Stream Line Stubs**: Tests that construct Claude CLI JSONL shapes (assistant messages, tool results, etc.) must
use stubs from `@dungeonmaster/shared/contracts` — not raw inline JSON. See `packages/shared/CLAUDE.md` for reasoning.

### Common Commands

- **Build**: `npm run build`

Four build cases the `<dungeonmaster-buildDiscipline>` snippet cannot know, because they are this checkout's:

| Before this                                | Build                                    | Why                                                                                                                                                                       |
|--------------------------------------------|------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `npm run prod`                             | the whole repo                           | runs `packages/server/dist/bin/server-entry.js`, and `vite preview` serves `packages/web/dist`                                                                             |
| lint, after a `locationsStatics` change    | `--workspace=@dungeonmaster/shared`      | `eslint.config.js` loads this repo's own rules from source, but they import `@dungeonmaster/shared/statics` at module load, and ESLint sets no `source` condition           |
| `npm run check:published`                  | `npm run build:clean`                    | it grades compiled output, and a warm tree still holds emit that no current build config would produce                                                                     |
| running anything in a fresh worktree       | nothing — `create-worktree` does it      | `git worktree add` checks out TRACKED files and `dist` is gitignored, so the tool `cp -a`s the main checkout's `dist` across at carve time                                 |

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

## Searching From a Session Launched In This Repo

This repo's `PreToolUse` hooks are **session-global** — they fire even while you are working in a
different sibling repo. Blocked session-wide: Bash `grep`/`find`/`rg`, the native Glob/Grep/Search
tools, bare `tsc`, and bare `npx eslint`. The `discover` / `get-project-map` MCP tools only see this
repo's `packages/**`, so they cannot search a sibling repo either.

Workarounds: search file contents with a `python3` one-liner (`os.walk` + regex); read files with the
`Read` tool; typecheck through the target repo's own npm script that wraps tsc (`npm run build`),
since the hook keys on the command token, not the working directory. `ls` and
`npx playwright test <spec>` are not blocked.

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
