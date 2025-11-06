# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## MCP Architecture Tools - MANDATORY WORKFLOW

**🚨 CRITICAL: This workflow is REQUIRED for EVERY task. No exceptions. No discretion. No shortcuts. 🚨**

**This is NOT a suggestion. This is NOT optional. This is NOT "recommended best practice".**

**EVERY Claude Code instance MUST follow this workflow for EVERY request without deviation.**

When starting ANY task in this codebase, you MUST follow this workflow exactly:

### ⚠️ ENFORCEMENT RULE

**You MUST run `get-architecture()` FIRST for ANY request, including:**

- Bug fixes
- Lint violation fixes
- New features
- Refactoring
- Writing tests
- Documentation
- Exploring code
- EVERYTHING

**DO NOT:**

- Skip steps because you "already know" the architecture
- Use Grep/Read to discover patterns instead of MCP tools
- Jump straight to fixing code without MCP tools
- Assume anything about folder structure or conventions
- Fix code without running tests to verify functionality
- Consider a task "done" if tests are failing or lint violations remain

### 1. **Understand the Request**
- Identify what needs to be built, fixed, or explored
- Extract key requirements and constraints from user request

### 2. **Get Repository Orientation** (`get-architecture`) - ALWAYS RUN FIRST
- **Tool**: `mcp__questmaestro__get-architecture`
- **MANDATORY**: Run this for EVERY request - bug fixes, new features, lint fixes, refactors, everything
- **NO EXCEPTIONS**: Even if you "know" the architecture, run this first
- **Returns**: Folder types, import hierarchy, decision tree, critical rules (~1K tokens)
- **Purpose**: Understand where code should go and architectural constraints

### 3. **Discover Existing Code** (`discover` with `type: "files"`)
- **Tool**: `mcp__questmaestro__discover({ type: "files", ... })`
- **When**: Need to find existing utilities, avoid reinventing the wheel
- **Two-Step Discovery Pattern**:
    1. **Browse** - Get lightweight list of what exists
        - `{ type: "files", path: "packages/eslint-plugin/src/guards" }` → Tree list with names + purposes
        - `{ type: "files", fileType: "broker", search: "user" }` → Filtered by type/keyword
    2. **Get Details** - Get full metadata for specific file you're interested in
        - `{ type: "files", name: "has-file-suffix-guard" }` → Full signature, usage, purpose, related files
        - **Name format**: Use exact kebab-case name from browse results (like `has-file-suffix-guard`)
- **Returns**:
    - Browse (path/fileType/search) → Tree-formatted list showing names + purposes only
    - Details (name) → Full metadata with signature, usage examples, related test/proxy files
- **Purpose**: Browse what exists → Get details on promising matches → Decide to reuse or create new

### 4. **Get Folder-Specific Rules** (`get-folder-detail`)
- **Tool**: `mcp__questmaestro__get-folder-detail({ folderType: "guards" })`
- **When**: About to create/modify files in a specific folder type
- **Returns**: Purpose, naming conventions, import rules, constraints (~500-1K tokens)
- **Purpose**: Understand all rules for the specific layer you're working in

### 5. **Get Universal Syntax Rules** (`get-syntax-rules`)
- **Tool**: `mcp__questmaestro__get-syntax-rules`
- **When**: Writing new code or unsure about syntax conventions
- **Returns**: All universal rules (file naming, exports, types, etc.) (~5K tokens)
- **Purpose**: Ensure code passes ESLint and follows conventions

### 6. **Get Testing Patterns** (`get-testing-patterns`)

- **Tool**: `mcp__questmaestro__get-testing-patterns`
- **When**: Writing tests or creating proxy files
- **Returns**: Testing philosophy, proxy patterns, assertions, test structure (~5K tokens)
- **Purpose**: Understand testing architecture, mock boundaries, and proxy creation

### 7. **Execute the Task**
- Use TodoWrite to track implementation steps
- Write code following MCP-provided patterns and rules
- Run tests and verify
- **Only Read files when you need to modify/test them, NOT for discovering patterns**

---

## Critical: MCP Tools Provide Complete Guidance

**NEVER Read files to discover patterns** - the 5 MCP tools provide everything:
- `get-architecture` → Full folder type descriptions with examples
- `get-folder-detail` → Complete patterns, constraints, and code examples for each folder
- `get-syntax-rules` → Universal syntax with examples and violations
- `get-testing-patterns` → Testing philosophy, proxy patterns, assertions, test structure
- `discover({ type: "files" })` → Find what exists, browse/get details (for reuse detection)

**Only use Read when:**
- You need to modify an existing file (bug fix, refactor)
- You need to understand a specific file's current implementation before editing
- You're analyzing code for a specific purpose (NOT for discovering patterns)

**MCP-First Discovery Pattern:**

```markdown
// 1. Get orientation - WHERE does code go?
get-architecture() // Returns decision tree, folder purposes

// 2. Get folder-specific rules with EXAMPLES
get-folder-detail({ folderType: "guards" })
// Returns: purpose, naming, imports, constraints, code examples, proxy requirements

// 3. Check if similar utility already exists (avoid duplication)
discover({ type: "files", path: "packages/eslint-plugin/src/guards" })
// Browse: Returns tree of existing guards
discover({ type: "files", name: "has-permission-guard" })
// Get details: If promising match found, check if you can reuse it

// 4. Get universal syntax rules (final refresh before writing)
get-syntax-rules()
// Returns: all conventions with correct/incorrect examples

// 5. Get testing patterns (when writing tests/proxies)
get-testing-patterns()
// Returns: testing philosophy, proxy patterns, assertions, test structure

// 6. Write ALL required files from MCP guidance (no Read needed!)
Write implementation file following get-folder-detail and get-syntax-rules examples
Write test file following get-testing-patterns
Write proxy file following get-testing-patterns and get-folder-detail proxy patterns
Write any other required files (stub, etc.) per folder requirements

// 7. Run tests to verify
npm test -- path/to/file.test.ts
```

**Parameter Format Reference:**
- `path`: Filesystem path → `"packages/eslint-plugin/src/guards"`
- `fileType`: Suffix without dash → `"broker"`, `"guard"`, `"transformer"`
- `name`: Exact kebab-case name from browse results → `"has-file-suffix-guard"` (copy from tree list)
- `search`: Keywords in purpose/name → `"user authentication"`, `"error handling"`

**Two-Step Discovery Example:**

```markdown
// Step 1: Browse guards
discover({ type: "files", path: "packages/eslint-plugin/src/guards" })
// Returns: "has-file-suffix-guard (guard) - Checks if a filename ends..."

// Step 2: Get details on that specific guard
discover({ type: "files", name: "has-file-suffix-guard" })
// Returns: { signature: "export const hasFileSuffixGuard = ...", usage: "...", ... }
```

---

## Common Workflow Scenarios

### Scenario A: Create New File From Scratch

```markdown
// 1. Orient: Where does this code go?
get-architecture() // Use decision tree

// 2. Get complete folder-specific rules WITH EXAMPLES
get-folder-detail({ folderType: "guards" })
// Returns everything: patterns, naming, imports, code examples, proxy requirements

// 3. Browse existing utilities (avoid reinventing)
discover({ type: "files", path: "packages/eslint-plugin/src/guards" })
// Returns tree: "has-permission-guard (guard) - Validates permissions..."
discover({ type: "files", name: "has-permission-guard" })
// Get details on promising match - decide if you can reuse it

// 4. Get universal syntax rules (final refresh before writing)
get-syntax-rules()
// Returns all conventions with correct/incorrect code examples

// 5. Get testing patterns (for writing tests/proxies)
get-testing-patterns()
// Returns testing philosophy, proxy patterns, assertions, test structure

// 6. Write ALL required files from MCP examples (no Read needed!)
Write implementation file following get-folder-detail and get-syntax-rules examples
Write test file following get-testing-patterns
Write proxy file following get-testing-patterns and get-folder-detail proxy patterns
Write any other required files (stub, etc.) per folder requirements

// 7. Run tests to verify
npm test -- path/to/file.test.ts
```

### Scenario B: Fix Bug in Existing File

```markdown
// 1. Get architecture roadmap FIRST
get-architecture()
// Understand folder structure and import rules

// 2. Find the file you need to fix
discover({ type: "files", fileType: "broker", search: "user fetch" })
// Browse results to find the file
discover({ type: "files", name: "user-fetch-broker" })
// Get details to see current signature/usage

// 3. Read the file you need to modify (this is valid - you're editing it)
Read the path from discover result

// 4. Get the correct patterns from MCP (NOT from other files)
get-folder-detail({ folderType: "brokers" })
// Returns: patterns, proxy requirements

// 5. Get syntax rules (final refresh before fixing)
get-syntax-rules()
// Returns complete examples of correct patterns

// 6. Fix using MCP-provided patterns
Edit the file following MCP examples

// 7. Update tests if needed (Read only what you're editing)
get-testing-patterns() // Get test patterns before updating tests
Read existing test (if you need to modify it)
Edit following get-testing-patterns

// 8. Run tests to verify fix
npm test -- path/to/file.test.ts
```

### Scenario C: Write Tests for Existing Code

```markdown
// 1. Get architecture roadmap FIRST
get-architecture()
// Understand folder structure and testing requirements

// 2. Read the implementation you're testing
Read the file to test

// 3. Get folder-specific testing requirements
get-folder-detail({ folderType: "guards" })
// Returns: proxy requirements, folder-specific patterns

// 4. Get testing patterns from MCP (NOT from other test files)
get-testing-patterns()
// Returns complete testing guidance: philosophy, proxy patterns, assertions, structure

// 5. Get syntax rules (final refresh before writing)
get-syntax-rules()
// Ensure test follows all conventions

// 6. Write test and proxy from MCP examples (no searching needed!)
Write test file following get-testing-patterns
Write proxy file following get-testing-patterns and get-folder-detail proxy patterns

// 7. Run tests to verify
npm test -- path/to/file.test.ts
```

### Scenario D: Refactor Across Multiple Files

```markdown
// 1. Get architecture roadmap FIRST - MANDATORY
get-architecture()
// CRITICAL: See import hierarchy and layer boundaries before refactoring

// 2. Find all files you need to modify
discover({ type: "files", search: "feature-name" })

// 3. Read the files you need to edit (valid - you're modifying them)
Read each file from discover results

// 4. Get refactoring guidance from MCP for each layer
get-folder-detail({ folderType: "brokers" })
get-folder-detail({ folderType: "adapters" })
// Each returns complete patterns and constraints

// 5. Get syntax rules (final refresh before refactoring)
get-syntax-rules()
// Ensure all changes follow conventions

// 6. Refactor using MCP patterns
Edit files following MCP-provided examples and import rules

// 7. Run tests to verify refactor
npm test
```

### Scenario E: Fix Lint Violations (Multiple Files)

```markdown
// 1. Get architecture roadmap FIRST - MANDATORY even for lint fixes
get-architecture()
// Understand folder structure, import rules, and architectural constraints

// 2. Get folder-specific rules for the affected folder type
get-folder-detail({ folderType: "contracts" })
// Returns: naming conventions, required files (stubs, tests), parameter patterns, proxy requirements

// 3. Get universal syntax rules
get-syntax-rules()
// Returns: destructuring patterns, branding requirements, all conventions with examples

// 4. Get testing patterns (if creating/fixing tests/proxies/stubs)
get-testing-patterns()
// Returns: testing philosophy, proxy patterns, stub patterns, assertions

// 5. Discover existing files in the folder to understand structure
discover({ type: "files", path: "packages/hooks/src/contracts" })
// Browse to see which files exist and their structure

// 6. Read ONLY the files you need to fix
Read each file that needs modification

// 7. Fix violations using MCP-provided patterns
// Group by error type for efficiency:
// - Missing stubs/tests: Create using get-testing-patterns and get-folder-detail examples
// - Missing proxies: Create using get-testing-patterns proxy patterns
// - Parameter patterns: Fix using get-syntax-rules destructuring examples
// - Branding issues: Fix using get-syntax-rules branded type examples

// 8. Run tests FIRST to verify fixes don't break functionality - MANDATORY
npm test -- path/to/affected/files
// Tests MUST pass before considering the fix complete

// 9. Run lint to verify all violations are resolved
npm run ward "*pattern*"
// OR npx eslint path/to/files

// 10. If tests fail, fix the issues and repeat steps 8-9
// NEVER leave broken tests or lint violations
```

---

## Critical Best Practices

**❌ Don't:**
- Read files to discover patterns (MCP tools provide all examples)
- Search the codebase for "similar implementations" to copy patterns
- Look at other test files to understand testing patterns
- Skip MCP tools and assume you know the patterns
- Use Read for anything except files you're directly modifying

**✅ Do:**
- Get ALL patterns from 4 MCP tools: get-architecture → get-folder-detail → get-syntax-rules → discover
- Trust the 4 MCP tools provide complete guidance with examples
- Only Read files when you need to modify/analyze them specifically
- Use discover({ type: "files" }) to browse what exists, then get details on specific files
- Verify name format for discover (exact kebab-case from browse results)
- Follow this flow: MCP tools for patterns → Write code → Read only what you edit

---

## Example Workflow: "Add user authentication guard"

```markdown
// Step 1: Understand - need a guard for user authentication

// Step 2: Get architecture roadmap FIRST
mcp__questmaestro__get-architecture()
// Returns: guards are pure boolean functions, decision tree shows guards/ is correct location
// Understand import rules and folder structure

// Step 3: Get complete guard patterns WITH EXAMPLES
mcp__questmaestro__get-folder-detail({ folderType: "guards" })
// Returns: purpose, naming (-guard.ts suffix), imports, constraints, code examples, proxy requirements

// Step 4: Browse existing guards (avoid duplication)
mcp__questmaestro__discover({ type: "files", path: "packages/eslint-plugin/src/guards" })
// Returns tree: "is-authenticated-guard (guard) - Checks user authentication..."
mcp__questmaestro__discover({ type: "files", name: "is-authenticated-guard" })
// If found similar match → Get details to see if you can reuse it

// Step 5: Get universal syntax rules (final refresh before writing)
mcp__questmaestro__get-syntax-rules()
// Returns: export const arrow functions, object destructuring, branded types, WITH examples

// Step 6: Get testing patterns
mcp__questmaestro__get-testing-patterns()
// Returns: testing philosophy, proxy patterns (guards typically don't need proxies), assertions

// Step 7: Write ALL required files directly from MCP examples (no Read needed!)
Write("packages/eslint-plugin/src/guards/is-authenticated/is-authenticated-guard.ts")
// Follow patterns from get-folder-detail and get-syntax-rules
Write("packages/eslint-plugin/src/guards/is-authenticated/is-authenticated-guard.test.ts")
// Follow testing patterns from get-testing-patterns (no proxy for pure functions)

// Step 8: Run tests to verify
npm test -- packages/eslint-plugin/src/guards/is-authenticated/is-authenticated-guard.test.ts
```

## Optimization Tools

**MCP Discovery (Preferred)**: Use `mcp__questmaestro__discover` for two-step file discovery:

**1. Browse Mode** (path/fileType/search queries):
- `discover({ type: "files", path: "packages/eslint-plugin/src/guards" })` - Browse all guards
- `discover({ type: "files", fileType: "broker", search: "user" })` - Find brokers matching keyword
- Returns tree-formatted string (very token-efficient)
- Shows: name + type + purpose only

**Example Browse Response:**
```
guards/
  has-permission-guard (guard) - Validates that user has permission to edit resource
  is-authenticated-guard (guard) - Checks if user is authenticated
```

**2. Details Mode** (name query):
- `discover({ type: "files", name: "has-permission-guard" })` - Get full metadata for specific file
- Returns complete information: signature, usage, purpose, related files

**Example Details Response:**
```json
{
  "results": [
    {
      "name": "has-permission-guard",
      "path": "packages/eslint-plugin/src/guards/has-permission/has-permission-guard.ts",
      "type": "guard",
      "purpose": "Validates that user has permission to edit resource",
      "usage": "if (hasPermissionGuard({ user, resource })) { /* ... */ }",
      "signature": "export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean =>",
      "relatedFiles": [
        "has-permission-guard.test.ts"
      ]
    }
  ],
  "count": 1
}
```

**Note:** Files without PURPOSE/USAGE metadata are still returned as long as they have an exported function!

**Command-line Tools** (use sparingly):

1. File Preview:
   - bat -n filepath for syntax-highlighted preview with line numbers
2. Bulk Refactoring:
   - rg -l "pattern" | xargs sed -i 's/old/new/g' for mass replacements
3. JSON Inspection:
   - jq '.key' file.json for quick JSON parsing

## Project Overview

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks are automatically reset/cleared/restored globally before each test via `@questmaestro/testing`
package. No need to manually add `jest.clearAllMocks()` in individual test files - test isolation is enforced
automatically.

**Shared Package**: `@questmaestro/shared` contains contracts, guards, transformers, and statics that are used by *
*multiple packages**.

**When to place code in `@questmaestro/shared`:**

- Configuration/statics needed by 2+ packages (e.g., `folderConfigStatics` used by eslint-plugin and mcp)
- Contracts used across package boundaries
- Guards and transformers with cross-package dependencies

**Important:** After modifying `@questmaestro/shared`, you MUST run `npm run build --workspace=@questmaestro/shared`
before other packages can use the updated code. The compiled dist/ folder is what gets imported by dependent packages.

**Usage Pattern:**

```typescript
// Import from subpath exports
import {folderConfigStatics} from '@questmaestro/shared/statics';
import {isKeyOfGuard} from '@questmaestro/shared/guards';
import {someContract} from '@questmaestro/shared/contracts';
```

**ESLint Rules**: All `@questmaestro/*` ESLint rules are located in `packages/eslint-plugin/src/brokers/rule/`. Each
rule has:

- Rule implementation: `{rule-name}/{rule-name}-rule-broker.ts`
- Rule tests: `{rule-name}/{rule-name}-rule-broker.test.ts`
- Rule registration: `packages/eslint-plugin/src/startup/start-eslint-plugin.ts`

### Common Commands
- **Run tests**: `npm test`
- **Run specific test file**: `npm test -- path/to/file.test.ts`
- **Ward (lint + typecheck filtered by glob)**: `npm run ward "*pattern*"` (e.g., `npm run ward "*enforce-jest*"`)
- **Build**: `npm run build`