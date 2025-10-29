# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## Optimization Tools

**MCP Discovery (Preferred)**: Use `mcp__questmaestro__discover` for file discovery with metadata:

- `discover({ type: "files", path: "packages/eslint-plugin/src/guards" })` - Get all guards with PURPOSE, USAGE,
  signatures
- `discover({ type: "files", fileType: "broker", search: "user" })` - Find brokers matching search term
- Much more token-efficient than file exploration or multiple Grep/Read calls
- Returns: name, path, type, purpose, usage, function signature

**Command-line Tools** (use sparingly):

1. File Preview:
   - bat -n filepath for syntax-highlighted preview with line numbers
2. Bulk Refactoring:
   - rg -l "pattern" | xargs sed -i 's/old/new/g' for mass replacements
3. JSON Inspection:
   - jq '.key' file.json for quick JSON parsing

## Standards Documents

- [Project Standards](packages/standards/project-standards.md) - Universal project structure, naming conventions, and
  architectural patterns
- [Testing Standards](packages/standards/testing-standards.md) - Testing format for LLMs and human scanning

## Project Overview

**Tech Stack**: TypeScript, Node.js, Jest
**Package Manager**: npm

**Testing**: Jest mocks are automatically reset/cleared/restored globally before each test via `@questmaestro/testing`
package. No need to manually add `jest.clearAllMocks()` in individual test files - test isolation is enforced
automatically.

**Shared Package**: `@questmaestro/shared` contains shared contracts and utilities. After modifying contracts, you MUST
run `npm run build --workspace=@questmaestro/shared` before other packages can use the updated contracts. The compiled
dist/ folder is what gets imported by dependent packages.

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