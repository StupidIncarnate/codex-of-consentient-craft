# @dungeonmaster/mcp

MCP (Model Context Protocol) server for discovering utilities, brokers, and all code files across the Dungeonmaster
codebase, plus architecture orientation tools.

## Purpose

Solves the problem of LLMs reinventing the wheel and lacking architectural context by providing:

- **File Discovery** - Shows what utilities exist (guards, transformers, brokers, widgets, etc.) with usage examples
- **Architecture Orientation** - Complete project structure, folder types, and import hierarchy
- **Folder-Specific Rules** - Detailed constraints and patterns for each folder type
- **Universal Syntax Rules** - All coding conventions with examples
- Helps LLMs make informed decisions about which utility to use and where code belongs

## Architecture

### MCP Endpoints (4 Tools)

#### 1. `discover` - File Discovery

```typescript
discover({
    type: "files",       // Required (only value)
    path? : string,       // "packages/eslint-plugin/src/guards"
    fileType? : string,   // "broker" | "widget" | "guard" | ...
    search? : string,     // "user authentication"
    name? : string,       // "userFetchBroker"
})
```

#### 2. `get-architecture` - Architecture Overview

```typescript
get - architecture()
// Returns: Folder types, import hierarchy, decision tree, critical rules
```

#### 3. `get-folder-detail` - Folder-Specific Rules

```typescript
get - folder - detail({
    folderType: "guards" | "brokers" | "adapters" | ... // 14 types
})
// Returns: Purpose, naming, imports, constraints, code examples
```

#### 4. `get-syntax-rules` - Universal Syntax Rules

```typescript
get - syntax - rules()
// Returns: All coding conventions with examples and violations
```

### Comment Metadata Format

Every file must have structured metadata in comments:

```typescript
/**
 * PURPOSE: [One-line description of what it does]
 *
 * USAGE:
 * [Code example showing how to use it]
 * // [Comment explaining what it returns]
 */
export const functionName = () => {
    };
```

**Optional fields:**

- `WHEN-TO-USE:` - Guidance on when to use this utility
- `WHEN-NOT-TO-USE:` - Anti-guidance (when NOT to use it)

### Response Format

```json
{
  "results": [
    {
      "name": "userFetchBroker",
      "path": "packages/eslint-plugin/src/brokers/user/fetch/user-fetch-broker.ts",
      "fileType": "broker",
      "purpose": "Fetches user data from the API by user ID",
      "signature": {
        "raw": "({ userId }: { userId: UserId }): Promise<User>",
        "parameters": [
          {
            "name": "destructured object",
            "type": {
              "userId": "UserId"
            }
          }
        ],
        "returnType": "Promise<User>"
      },
      "usage": "const user = await userFetchBroker({ userId: UserIdStub('...') });",
      "related": [
        "userCreateBroker",
        "userUpdateBroker"
      ],
      "metadata": {
        "dependencies": "httpAdapter (GET /api/users/:id)"
      }
    }
  ],
  "count": 1
}
```

## Implementation Status

### ✅ Completed

**Package Structure:**

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest test configuration

**Contracts:**

- `discover-input-contract.ts` - Input validation for discover tool (files only)
- `file-metadata-contract.ts` - File metadata structure
- `extracted-metadata-contract.ts` - Parsed comment metadata
- `file-contents-contract.ts` - File contents (branded string)
- `file-path-contract.ts` - File paths (branded string)
- `file-type-contract.ts` - File types (broker/widget/etc)

**Transformers:**

- `metadata-extractor-transformer.ts` - Extracts PURPOSE/USAGE from comments
- `signature-extractor-transformer.ts` - Extracts TypeScript function signatures
- `file-type-detector-transformer.ts` - Detects file type from path/naming

**Statics:**

- `folder-type-statics.ts` - List of valid folder types

**Brokers:**

- `file-scanner-broker.ts` - Scans directories for files with metadata
- `mcp-discover-broker.ts` - Main orchestration for file discovery
- `architecture-overview-broker.ts` - Generates architecture orientation docs
- `architecture-folder-detail-broker.ts` - Generates folder-specific rule docs
- `architecture-syntax-rules-broker.ts` - Generates universal syntax rules docs

**Adapters:**

- `fs-glob-adapter.ts` - Find files matching glob patterns
- `fs-read-file-adapter.ts` - Read file contents

**Guards:**

- `has-metadata-comment-guard.ts` - Validates metadata exists in file
- `has-exported-function-guard.ts` - Checks for exported function
- `is-multi-dot-file-guard.ts` - Checks for multi-dot files (.test.ts, etc.)

**MCP Server:**

- `start-mcp-server.ts` - MCP server initialization
    - Registers 4 tools: discover, get-architecture, get-folder-detail, get-syntax-rules
    - Handles MCP protocol communication

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build

# Run in dev mode (watch)
npm run dev
```

## Usage Examples

### 1. Get Architecture Overview

```typescript
get - architecture()
// Returns: folder types, decision tree, import hierarchy
```

### 2. Get Folder-Specific Rules

```typescript
get - folder - detail({folderType: "guards"})
// Returns: purpose, naming conventions, import rules, constraints, code examples
```

### 3. Get Universal Syntax Rules

```typescript
get - syntax - rules()
// Returns: all coding conventions with examples
```

### 4. Discover Brokers for User Operations

```typescript
discover({
    type: "files",
    fileType: "broker",
    search: "user"
})
```

### 5. Find a Specific Guard

```typescript
discover({
    type: "files",
    name: "is-test-file"  // kebab-case, no suffix
})
```

### 6. Browse All Guards

```typescript
discover({
    type: "files",
    fileType: "guard",
    path: "packages/eslint-plugin/src/guards"
})
```

## Integration with Claude Code

The MCP server is configured in Claude Code settings and provides all 4 tools automatically.

**Recommended Workflow:**

1. `get-architecture` → Understand where code goes
2. `get-folder-detail` → Get folder-specific rules with examples
3. `get-syntax-rules` → Get universal syntax conventions
4. `discover({ type: "files" })` → Find existing code to reuse
5. Write code following MCP-provided patterns (no need to read examples!)

**Key Philosophy:** MCP tools provide COMPLETE guidance with examples. Never read files just to discover patterns - only
read files you're directly modifying.

## Related Packages

- `@dungeonmaster/eslint-plugin` - Where most utilities live (guards, transformers, brokers)
- `@dungeonmaster/shared` - Shared contracts and utilities
- `@dungeonmaster/tooling` - Tooling utilities
- `@dungeonmaster/hooks` - Hook scripts
