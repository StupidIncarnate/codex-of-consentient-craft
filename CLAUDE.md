# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## What This Repo Is

This is a **published npm package** (`dungeonmaster`). When users install it in their projects and run
`dungeonmaster init`, the CLI:

1. Discovers all packages in `packages/*/dist/startup/start-install.js`
2. Dynamically imports and executes each package's `StartInstall` function
3. Each package's install script sets up its own config (e.g., CLI adds devDependencies, etc.)

**Important:** Each package has a `startup/start-install.ts` that gets dynamically imported at runtime. Keep install
logic directly in these startup files - don't move it to brokers (the CLI orchestration layer handles
discovery/execution).

## Architecture Tools (MCP) - MANDATORY WORKFLOW

**CRITICAL: Use architecture MCP tools FIRST for EVERY task. No exceptions.**

Architecture documentation and code discovery are available as MCP tools.

### Available MCP Tools

- **`get-architecture`** (no params) - ALWAYS RUN FIRST
    - Returns: Folder types, import hierarchy, decision tree (~1K tokens)
    - Purpose: Understand where code goes and architectural constraints

- **`discover`** (params: `{ type, path?, fileType?, search?, name?, section? }`) - Find existing code
    - Browse: `{ type: "files", path: "packages/X/src/guards" }` - Tree list of files with purposes
    - Details: `{ type: "files", name: "has-file-suffix-guard" }` - Full metadata (signature, usage, related files)
    - Purpose: Check if similar code exists before creating new

- **`get-folder-detail`** (params: `{ folderType }`) - Get folder-specific rules
    - Returns: Purpose, naming, imports, constraints, code examples, proxy requirements (~500-1K tokens)
    - Purpose: Complete patterns for the specific folder you're working in

- **`get-syntax-rules`** (no params) - Universal syntax conventions
    - Returns: File naming, exports, types, destructuring, all conventions with examples (~5K tokens)
    - Purpose: Ensure code passes ESLint

- **`get-testing-patterns`** (no params) - Testing architecture
    - Returns: Testing philosophy, proxy patterns, assertions, test structure (~5K tokens)
    - Purpose: Understand how to write tests and proxy files

### Standard Workflow

```
1. Use `discover` tool with { type: "files", search: "..." }       // Check if code exists
2. Use `get-folder-detail` tool with { folderType: "FOLDER_TYPE" } // Get folder patterns
3. Use `get-syntax-rules` tool                                     // Get syntax conventions
4. Use `get-testing-patterns` tool                                 // Get testing patterns (if writing tests)
5. Write code following tool-provided examples                     // All patterns provided by tools
6. Run tests to verify                                             // npm run ward -- --only test -- path/to/file.test.ts
```

### Refactor Scenario

When existing code violates architecture:

```
1. Use `discover` tool to find files needing refactor              // Find all affected files
2. Use `get-folder-detail` tool for target folder                  // Get correct patterns
3. Use `get-syntax-rules` tool                                     // Get syntax requirements
4. Use `get-testing-patterns` tool                                 // Get test/proxy patterns
5. Read files you're modifying                                     // Only now read
6. Create new files following tool-provided patterns               // Write with correct structure
7. Update imports in dependent files                               // Fix references
8. Delete old non-conforming files                                 // Clean up
9. Run tests to verify                                             // Ensure nothing breaks
```

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

- **Run all quality checks**: `npm run ward`
- **Run lint only**: `npm run ward -- --only lint`
- **Run tests only**: `npm run ward -- --only test`
- **Run typecheck only**: `npm run ward -- --only typecheck`
- **Run specific test file**: `npm run ward -- --only test -- path/to/file.test.ts`
- **Get full error details after a failing run**: Use MCP tool `ward-list` with the run ID
- **Build**: `npm run build`
- **Start dev server**: `npm run dev`

**When ward fails:** The run output shows a summary with truncated errors. Use the MCP tool `ward-list` with the
run ID shown at the bottom to get full details — especially jest diffs for test failures.
