# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

**Do NOT use `~/tmp` for scratch files** — it has permission issues. Use `<repoRoot>/tmp` instead (already present at
the root of this repo). This keeps scratch files inside the repo's permission scope and, for eslint work, inside the
folder that actually triggers the linter.

**Critical:** Do not document historical state. CLAUDE.md files, code comments, JSDoc, and
test descriptions should describe what the code does NOW — never "used to do", "previously",
"historically", or "before the X fix". Git is the history. If the current design needs
rationale, state the rationale in present tense ("keys on toolUseId because…") not as a
contrast with a deleted implementation. When you remove code, remove every comment that
refers to what was removed.

## What This Repo Is

This is a **published npm package** (`dungeonmaster`). When users install it in their projects and run
`dungeonmaster init`, the CLI:

1. Discovers all packages in `packages/*/dist/startup/start-install.js`
2. Dynamically imports and executes each package's `StartInstall` function
3. Each package's install script sets up its own config (e.g., CLI adds devDependencies, etc.)

**Important:** Each package has a `startup/start-install.ts` that gets dynamically imported at runtime. Keep install
logic directly in these startup files - don't move it to brokers (the CLI orchestration layer handles
discovery/execution).

## Worktree Isolation

When the repo is cloned into a `worktrees/` directory alongside sibling worktrees, `npm install` auto-generates a
`.env` file via `scripts/worktree-env-setup.js` (the `postinstall` hook).

- **Port assignment** is deterministic: sibling folders are sorted by filesystem creation time (`birthtime`) and each
  gets `4700 + index * 10` (e.g. 4700, 4710, 4720). The 10-step gap leaves room for server port and web port (port+1).
- **`DUNGEONMASTER_HOME`** points to `.dungeonmaster-home` inside the worktree, keeping data isolated per worktree.
- The `dev` and `dev:kill` scripts source `.env` automatically if it exists.
- To manually override: edit `.env` directly. The postinstall script never overwrites an existing `.env`.
- For non-worktree setups (regular clones, end-user installs) the script is a no-op.

## Project Info

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks auto-reset via `@dungeonmaster/testing` - no manual cleanup needed

**Integration Tests with File System**: Use `installTestbedCreateBroker` from `@dungeonmaster/testing` for isolated temp
directories. Never write test files directly to the repo.

```typescript
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

const testbed = installTestbedCreateBroker({
  baseName: BaseNameStub({ value: 'my-test' }),
});
// testbed.projectPath - isolated temp directory in /tmp
// testbed.cleanup() - removes temp directory
```

**Shared Package**: `@dungeonmaster/shared` for code used by multiple packages

- After modifying: `npm run build --workspace=@dungeonmaster/shared`
- Import: `import {x} from '@dungeonmaster/shared/statics'`

**JSONL Stream Line Stubs**: Tests that construct Claude CLI JSONL shapes (assistant messages, tool results, etc.) must
use stubs from `@dungeonmaster/shared/contracts` — not raw inline JSON. See `packages/shared/CLAUDE.md` for reasoning.

### Common Commands

- **Build**: `npm run build`
- **Start dev server**: `npm run dev`
- **Codebase orientation**: Use `get-project-map` MCP tool for a compact map of all packages, folder types, file counts,
  and domains (~6k tokens). Start here before using `discover` for targeted exploration.
- **Quality checks (ward)**: See `get-architecture` MCP tool output for full ward usage, check types, flags, and
  invocation patterns.

## Never Edit `.claude/settings.json` Directly

`.claude/settings.json` (and `settings.local.json`) have **permission issues** that block direct edits. Do NOT touch
them by hand. They are generated/merged by package `StartInstall` functions (hooks, permissions, etc.).

**To change anything in `.claude/settings.json`:**

1. Update the install logic in the package that owns that concern:
    - Hook entries (`PreToolUse`, `SessionStart`, `WorktreeCreate`, etc.) → `@dungeonmaster/hooks`
      (`transformers/dungeonmaster-hooks-creator/...` + `responders/install/create-settings/...`).
    - MCP permissions (`permissions.allow[]` entries like `mcp__dungeonmaster__<tool>`) → `@dungeonmaster/mcp`
      (`settingsPermissionsAddBroker`, generated from `mcpToolsStatics.tools.names`).
    - Other settings → the package whose `StartInstall` writes them.
2. From the repo root, run:
   ```bash
   npm run build
   npm link --workspaces
   npm run init
   ```
   `npm run init` invokes `dungeonmaster init`, which discovers each package's `dist/startup/start-install.js` and
   executes its `StartInstall` — that's what regenerates/merges `.claude/settings.json`.

If you're tempted to hand-edit `.claude/settings.json` to add/remove an entry, stop — fix the install logic so the entry
is produced the next time someone runs `npm run init`.

## Ward Invocation Rules (MANDATORY)

**Ward is a root-level monorepo script.** These rules apply to ALL agents, including sub-agents in worktrees.

1. **ALWAYS `npm run build` before ward.** Ward resolves cross-package types and imports through each
   package's `dist/`. A stale build surfaces as TS2339 "property X does not exist" on cross-package APIs
   even when the source is correct — e.g. a fix that added `StartOrchestrator.resumeQuest` in the
   orchestrator package will break the server package's typecheck until the orchestrator's `dist/` is
   rebuilt. Build FIRST, then ward:
   ```bash
   npm run build
   npm run ward
   ```
   This applies to scoped ward too (`npm run ward -- --only unit -- packages/X`). The build is
   fast (~7s); the time lost to re-diagnosing a stale-dist failure is much larger.

2. **NEVER `cd` into a package to run ward.** Ward runs from the repo root. To scope to a package, pass paths after
   `--`:
   ```bash
   # ✅ CORRECT
   npm run ward -- --only unit -- packages/orchestrator
   # ❌ WRONG - do not cd into the package
   cd packages/orchestrator && npm run ward
   ```

3. **NEVER sleep-poll for results.** Pick ONE of two modes and stick with it:
   - **Foreground** — call Bash without `run_in_background`; it blocks until the command finishes (use
     `timeout: 600000` so ward has room to complete).
   - **Background** — call Bash with `run_in_background: true` and wait for the task-notification to
     fire; then read the output file once.

   Do NOT combine them: no `sleep N && tail ...` loops, no "spawn in background then poll the output
   file while waiting." That pattern wastes wall-clock, burns context on partial output, and races
   with the real completion event.

4. **Run ward ONCE, not redundantly.** Pick the right flags and run it once. Do not run the same checks multiple ways
   (e.g., `--onlyTests "name"` AND `-- path/to/file.test.ts` separately). Do not run scoped ward per-package and then
   full ward again.

5. **Always use `timeout: 600000`** on all ward Bash calls. Ward takes 3-4 minutes across the monorepo; the default
   2-minute timeout kills it.

6. **When the user asks for full ward (`npm run ward`) to pass, YOU OWN EVERY FAILURE.** Not just the
   failures you think your changes caused — every single red test, lint error, and typecheck error. This
   is non-negotiable:

   - ❌ "That failure is pre-existing / from master / unrelated to my changes." → **NO**. Fix it.
   - ❌ "A different session caused that, not mine." → **NO**. Fix it.
   - ❌ "That test is wrong but I didn't write it." → **NO**. Fix the test OR the code; make it green.
   - ❌ "Git stash shows it fails without my changes too." → **Useful diagnostic, not an excuse**. Fix it.
   - ✅ "Ward is red. I need to make it green before handing back to the user." → YES. Do that.

   The user's smoke-testing loop is blocked while ward is red. Diagnose however you want, but the only
   acceptable outcome is `npm run ward` exits 0. If a fix would have broad blast radius or requires
   product decisions, surface that to the user BEFORE stopping — don't just report "out of scope" and
   walk away from a red ward.
