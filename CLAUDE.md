# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## What This Repo Is

This is a **published npm package** (`dungeonmaster`). When users install it in their projects and run
`dungeonmaster init`, the CLI:

1. Discovers all packages in `packages/*/dist/startup/start-install.js`
2. Dynamically imports and executes each package's `StartInstall` function
3. Each package's install script sets up its own config (e.g., MCP creates `.mcp.json`, CLI adds devDependencies, etc.)

**Important:** Each package has a `startup/start-install.ts` that gets dynamically imported at runtime. Keep install
logic directly in these startup files - don't move it to brokers (the CLI orchestration layer handles
discovery/execution).

## MCP Architecture Tools - MANDATORY WORKFLOW

**🚨 CRITICAL: Use MCP tools FIRST for EVERY task. No exceptions. 🚨**

### Available MCP Tools

- **`get-architecture()`** - ALWAYS RUN FIRST
    - Returns: Folder types, import hierarchy, decision tree (~1K tokens)
    - Purpose: Understand where code goes and architectural constraints

- **`discover({ type: "files", ... })`** - Find existing code
    - Browse: `{ path: "packages/X/src/guards" }` → Tree list of files with purposes
    - Details: `{ name: "has-file-suffix-guard" }` → Full metadata (signature, usage, related files)
    - Purpose: Check if similar code exists before creating new

- **`get-folder-detail({ folderType: "guards" })`** - Get folder-specific rules
    - Returns: Purpose, naming, imports, constraints, code examples, proxy requirements (~500-1K tokens)
    - Purpose: Complete patterns for the specific folder you're working in

- **`get-syntax-rules()`** - Universal syntax conventions
    - Returns: File naming, exports, types, destructuring, all conventions with examples (~5K tokens)
    - Purpose: Ensure code passes ESLint

- **`get-testing-patterns()`** - Testing architecture
    - Returns: Testing philosophy, proxy patterns, assertions, test structure (~5K tokens)
    - Purpose: Understand how to write tests and proxy files

### Standard Workflow

```
1. discover({ type: "files", ... })      // Check if code exists
2. get-folder-detail({ folderType })     // Get folder patterns
3. get-syntax-rules()                    // Get syntax conventions
4. get-testing-patterns()                // Get testing patterns (if writing tests)
5. Write code following MCP examples     // All patterns provided by MCP
6. Run tests to verify                   // npm test -- path/to/file.test.ts
```

### When to Use Read

**ONLY use Read when:**

- Modifying existing files (bug fixes, refactoring)
- Understanding a specific file's implementation before editing
- Analyzing code for a specific purpose

**NEVER use Read to:**

- Discover patterns (use MCP tools)
- Find "similar implementations" to copy (use MCP tools)
- Understand folder structure (use MCP tools)

### Refactor Scenario

When existing code violates architecture:

```
1. discover() to find files needing refactor       // Find all affected files
2. get-folder-detail() for target folder           // Get correct patterns
3. get-syntax-rules()                              // Get syntax requirements
4. get-testing-patterns()                          // Get test/proxy patterns
5. Read files you're modifying                     // Only now read
6. Create new files following MCP patterns         // Write with correct structure
7. Update imports in dependent files               // Fix references
8. Delete old non-conforming files                 // Clean up
9. Run tests to verify                            // Ensure nothing breaks
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
- **Run tests**: `npm test`
- **Run specific test**: `npm test -- path/to/file.test.ts`
- **Lint + typecheck**: `npm run ward "*pattern*"`
- **Build**: `npm run build`
