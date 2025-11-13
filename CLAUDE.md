# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## MCP Architecture Tools - MANDATORY WORKFLOW

**🚨 CRITICAL: Use MCP tools FIRST for EVERY task. No exceptions. 🚨**

### Available MCP Tools

1. **`get-architecture()`** - ALWAYS RUN FIRST
    - Returns: Folder types, import hierarchy, decision tree (~1K tokens)
    - Purpose: Understand where code goes and architectural constraints

2. **`discover({ type: "files", ... })`** - Find existing code
    - Browse: `{ path: "packages/X/src/guards" }` → Tree list of files with purposes
    - Details: `{ name: "has-file-suffix-guard" }` → Full metadata (signature, usage, related files)
    - Purpose: Check if similar code exists before creating new

3. **`get-folder-detail({ folderType: "guards" })`** - Get folder-specific rules
    - Returns: Purpose, naming, imports, constraints, code examples, proxy requirements (~500-1K tokens)
    - Purpose: Complete patterns for the specific folder you're working in

4. **`get-syntax-rules()`** - Universal syntax conventions
    - Returns: File naming, exports, types, destructuring, all conventions with examples (~5K tokens)
    - Purpose: Ensure code passes ESLint

5. **`get-testing-patterns()`** - Testing architecture
    - Returns: Testing philosophy, proxy patterns, assertions, test structure (~5K tokens)
    - Purpose: Understand how to write tests and proxy files

### Standard Workflow

```
1. get-architecture()                    // Understand structure
2. discover({ type: "files", ... })      // Check if code exists
3. get-folder-detail({ folderType })     // Get folder patterns
4. get-syntax-rules()                    // Get syntax conventions
5. get-testing-patterns()                // Get testing patterns (if writing tests)
6. Write code following MCP examples     // All patterns provided by MCP
7. Run tests to verify                   // npm test -- path/to/file.test.ts
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
1. get-architecture()                              // See correct structure
2. discover() to find files needing refactor       // Find all affected files
3. get-folder-detail() for target folder           // Get correct patterns
4. get-syntax-rules()                              // Get syntax requirements
5. get-testing-patterns()                          // Get test/proxy patterns
6. Read files you're modifying                     // Only now read
7. Create new files following MCP patterns         // Write with correct structure
8. Update imports in dependent files               // Fix references
9. Delete old non-conforming files                 // Clean up
10. Run tests to verify                            // Ensure nothing breaks
```

## Project Info

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks auto-reset via `@questmaestro/testing` - no manual cleanup needed

**Shared Package**: `@questmaestro/shared` for code used by multiple packages

- After modifying: `npm run build --workspace=@questmaestro/shared`
- Import: `import {x} from '@questmaestro/shared/statics'`

### Common Commands
- **Run tests**: `npm test`
- **Run specific test**: `npm test -- path/to/file.test.ts`
- **Lint + typecheck**: `npm run ward "*pattern*"`
- **Build**: `npm run build`
