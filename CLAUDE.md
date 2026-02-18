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

## Architecture Tools (HTTP API) - MANDATORY WORKFLOW

**CRITICAL: Use architecture API endpoints FIRST for EVERY task. No exceptions.**

The dungeonmaster server exposes HTTP endpoints for architecture documentation and code discovery.
Start the server with `npm run dev` and use `curl` via `Bash` to query these endpoints.

### Available Endpoints

- **`GET /api/docs/architecture`** - ALWAYS RUN FIRST
    - Returns: Folder types, import hierarchy, decision tree (~1K tokens)
    - Purpose: Understand where code goes and architectural constraints
  - Example: `curl -s http://localhost:4737/api/docs/architecture`

- **`POST /api/discover`** - Find existing code
    - Browse: `{"type":"files", "path":"packages/X/src/guards"}` - Tree list of files with purposes
    - Details: `{"type":"files", "name":"has-file-suffix-guard"}` - Full metadata (signature, usage, related files)
    - Purpose: Check if similar code exists before creating new
    - Example:
      `curl -s http://localhost:4737/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","search":"user"}'`

- **`GET /api/docs/folder-detail/:type`** - Get folder-specific rules
    - Returns: Purpose, naming, imports, constraints, code examples, proxy requirements (~500-1K tokens)
    - Purpose: Complete patterns for the specific folder you're working in
  - Example: `curl -s http://localhost:4737/api/docs/folder-detail/guards`

- **`GET /api/docs/syntax-rules`** - Universal syntax conventions
    - Returns: File naming, exports, types, destructuring, all conventions with examples (~5K tokens)
    - Purpose: Ensure code passes ESLint
  - Example: `curl -s http://localhost:4737/api/docs/syntax-rules`

- **`GET /api/docs/testing-patterns`** - Testing architecture
    - Returns: Testing philosophy, proxy patterns, assertions, test structure (~5K tokens)
    - Purpose: Understand how to write tests and proxy files
  - Example: `curl -s http://localhost:4737/api/docs/testing-patterns`

### Standard Workflow

```
1. curl -s http://localhost:4737/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","search":"..."}'   // Check if code exists
2. curl -s http://localhost:4737/api/docs/folder-detail/FOLDER_TYPE   // Get folder patterns
3. curl -s http://localhost:4737/api/docs/syntax-rules                // Get syntax conventions
4. curl -s http://localhost:4737/api/docs/testing-patterns            // Get testing patterns (if writing tests)
5. Write code following API-provided examples                         // All patterns provided by API
6. Run tests to verify                                                // npx dungeonmaster-ward run --only test -- path/to/file.test.ts
```

### When to Use Read

**ONLY use Read when:**

- Modifying existing files (bug fixes, refactoring)
- Understanding a specific file's implementation before editing
- Analyzing code for a specific purpose

**NEVER use Read to:**

- Discover patterns (use architecture API endpoints)
- Find "similar implementations" to copy (use architecture API endpoints)
- Understand folder structure (use architecture API endpoints)

### Refactor Scenario

When existing code violates architecture:

```
1. POST /api/discover to find files needing refactor       // Find all affected files
2. GET /api/docs/folder-detail/:type for target folder     // Get correct patterns
3. GET /api/docs/syntax-rules                              // Get syntax requirements
4. GET /api/docs/testing-patterns                          // Get test/proxy patterns
5. Read files you're modifying                             // Only now read
6. Create new files following API-provided patterns        // Write with correct structure
7. Update imports in dependent files                       // Fix references
8. Delete old non-conforming files                         // Clean up
9. Run tests to verify                                     // Ensure nothing breaks
```

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

### Common Commands

- **Run all quality checks**: `npx dungeonmaster-ward run`
- **Run lint only**: `npx dungeonmaster-ward run --only lint`
- **Run tests only**: `npx dungeonmaster-ward run --only test`
- **Run typecheck only**: `npx dungeonmaster-ward run --only typecheck`
- **Run specific test file**: `npx dungeonmaster-ward run --only test -- path/to/file.test.ts`
- **Lint with glob pattern**: `npx dungeonmaster-ward run --only lint --glob "*pattern*"`
- **Get full error details after a failing run**: `npx dungeonmaster-ward list <run-id>`
- **Build**: `npm run build`
- **Start dev server**: `npm run dev`

**When ward fails:** The run output shows a summary with truncated errors. Follow the hint at the bottom
(`npx dungeonmaster-ward list <run-id>`) to get full details — especially jest diffs for test failures.
