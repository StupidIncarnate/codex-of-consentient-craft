# @questmaestro/mcp

MCP (Model Context Protocol) server for discovering utilities, brokers, standards, and all code files across the
Questmaestro codebase.

## Purpose

Solves the problem of LLMs reinventing the wheel by providing a discovery tool that:

- Shows what utilities exist (guards, transformers, brokers, widgets, etc.)
- Provides usage examples extracted from comments
- Helps LLMs make informed decisions about which utility to use
- Segments standards documents into callable sections

## Architecture

### Single MCP Endpoint: `discover`

```typescript
discover({
    type: "files" | "standards",

    // For type: "files"
    path? : string,       // "packages/eslint-plugin/src/guards"
    fileType? : string,   // "broker" | "widget" | "guard" | ...
    search? : string,     // "user authentication"
    name? : string,       // "userFetchBroker"

    // For type: "standards"
    section? : string,    // "testing/proxy-architecture"
})
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
 *
 * RELATED: [comma-separated list of related files]
 */
export const functionName = () => {
    };
```

**Optional fields:**

- `WHEN-TO-USE:` - Guidance on when to use this utility
- `WHEN-NOT-TO-USE:` - Anti-guidance (when NOT to use it)
- `RETURNS:` - Description of return value/format
- `PROPS:` - For widgets (component props)
- `BINDINGS:` - For widgets (what hooks they use)
- `CONTRACTS:` - For adapters (input/output types)

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

- `discover-input-contract.ts` - Input validation for discover tool
- `file-metadata-contract.ts` - File metadata structure
- `standards-section-contract.ts` - Standards document sections
- `extracted-metadata-contract.ts` - Parsed comment metadata
- `file-contents-contract.ts` - File contents (branded string)
- `file-path-contract.ts` - File paths (branded string)
- `file-type-contract.ts` - File types (broker/widget/etc)

**Transformers:**

- `metadata-extractor-transformer.ts` - Extracts PURPOSE/USAGE/RELATED from comments
- `signature-extractor-transformer.ts` - Extracts TypeScript function signatures
- `file-type-detector-transformer.ts` - Detects file type from path/naming

**Statics:**

- `folder-type-statics.ts` - List of valid folder types

### 🚧 TODO

**Guards:**

- `has-metadata-comment-guard.ts` - Validates metadata exists in file

**Adapters:**

- `fs-glob-adapter.ts` - Find files matching glob patterns (uses `glob` npm package)
- `fs-read-file-adapter.ts` - Read file contents (uses `fs/promises`)

**Brokers:**

- `file-scanner-broker.ts` - Scans directories for files with metadata
    - Uses fs-glob-adapter to find .ts/.tsx files
    - Uses fs-read-file-adapter to read contents
    - Uses metadata-extractor-transformer to parse comments
    - Uses signature-extractor-transformer to get function signatures
    - Uses file-type-detector-transformer to determine file type
    - Returns array of FileMetadata

- `standards-parser-broker.ts` - Parses markdown files into sections
    - Reads `packages/standards/*.md` files
    - Splits by headers (##, ###)
    - Creates addressable sections like "testing/proxy-architecture"

- `discover-broker.ts` - Main orchestration
    - Routes to file-scanner-broker or standards-parser-broker based on type
    - Formats response for MCP protocol

**MCP Server:**

- `start-mcp-server.ts` - MCP server initialization
    - Registers `discover` tool
    - Connects to discover-broker
    - Handles MCP protocol communication

**Testing:**

- Integration test: Scan actual repo files and verify metadata extraction works

**Documentation:**

- Example metadata comments for all existing utilities
- ESLint rule to enforce metadata comment structure (separate task)

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

### Discover brokers for user operations

```typescript
discover({
    type: "files",
    fileType: "broker",
    search: "user"
})
```

### Find a specific guard

```typescript
discover({
    type: "files",
    name: "isTestFileGuard"
})
```

### Get standards section

```typescript
discover({
    type: "standards",
    section: "testing/proxy-architecture"
})
```

### Browse all guards

```typescript
discover({
    type: "files",
    fileType: "guard",
    path: "packages/eslint-plugin/src/guards"
})
```

## Next Steps

1. **Complete remaining components** (adapters, brokers, MCP server)
2. **Add metadata comments to existing files** - Start with guards/transformers in eslint-plugin
3. **Create ESLint rule** to enforce metadata comment structure
4. **Wire up MCP server** in Claude Code settings
5. **Update CLAUDE.md** to document the discover tool

## Related Packages

- `@questmaestro/eslint-plugin` - Where most utilities live (guards, transformers, brokers)
- `@questmaestro/shared` - Shared contracts and utilities
- `@questmaestro/tooling` - Tooling utilities
- `@questmaestro/hooks` - Hook scripts
