# Project Guidelines

**Critical:** DO NOT run anything in /tmp if you're trying to test eslint effects. That folder is outside the repo and
thus won't trigger eslint at all.

## Optimization Tools

**MCP Discovery (Preferred)**: Use `mcp__questmaestro__discover` for file discovery with metadata:

- `discover({ type: "files", path: "packages/eslint-plugin/src/guards" })` - Get all guards with PURPOSE, USAGE,
  signatures
- `discover({ type: "files", fileType: "broker", search: "user" })` - Find brokers matching search term
- Much more token-efficient than file exploration or multiple Grep/Read calls
- Returns rich structured data: name, path, type, purpose (optional), usage (optional), function signature (optional)

**Example Response:**

```json
{
  "results": [
    {
      "name": "apply-overrides-transformer",
      "path": "/path/to/apply-overrides-transformer.ts",
      "type": "transformer",
      "signature": "export const applyOverridesTransformer = ({\n  preset,\n  config,\n}: {\n  preset: FrameworkPreset;\n  config: QuestmaestroConfig;\n}): FrameworkPreset =>"
    },
    {
      "name": "has-permission-guard",
      "path": "/path/to/has-permission-guard.ts",
      "type": "guard",
      "purpose": "Validates that user has permission to edit resource",
      "usage": "if (hasPermissionGuard({ user, resource })) { /* ... */ }",
      "signature": "export const hasPermissionGuard = ({ user, resource }: { user?: User; resource?: Resource }): boolean =>"
    }
  ],
  "count": 2
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