# MCP Server Manual Test Cases

## Prerequisites

- **IMPORTANT**: After any code changes, restart the MCP server before testing
- Server should be running via `node dist/index.js` from packages/mcp
- Server communicates via stdio transport (MCP protocol)

---

## 1. Tool: `discover` (File Discovery)

### Test 1.1: Discover All Files

**Input:**

```json
{
  "glob": "packages/*/src/**"
}
```

**Expected:**

- Returns all TypeScript implementation files with exported functions
- **Excludes multi-dot files** (.test.ts, .proxy.ts, etc.) from main results
- Each result includes: name, path, type, purpose (if available), usage (if available), signature (if available),
  relatedFiles (array)
- relatedFiles contains paths to associated .test.ts, .proxy.ts files (sorted alphabetically)
- Results sorted alphabetically by name
- Count matches number of results (implementation files only)

### Test 1.2: Discover by File Type (via glob)

**Input:**

```json
{
  "glob": "packages/*/src/brokers/**"
}
{
  "glob": "packages/*/src/guards/**"
}
{
  "glob": "packages/*/src/transformers/**"
}
{
  "glob": "packages/*/src/contracts/**"
}
```

**Expected:**

- Only returns files matching the specified type (detected from glob path)
- Brokers end in `-broker.ts`, guards in `-guard.ts`, etc.

### Test 1.3: Discover by Path (via glob)

**Input:**

```json
{
  "glob": "packages/eslint-plugin/src/guards/**"
}
{
  "glob": "packages/mcp/src/transformers/**"
}
```

**Expected:**

- Only returns files within the specified directory
- Searches recursively within that path

### Test 1.4: Discover by Path + File Type (via glob)

**Input:**

```json
{
  "glob": "packages/eslint-plugin/src/brokers/**/*-broker.ts"
}
```

**Expected:**

- Combined filtering: only brokers within the specified path

### Test 1.5: Discover by Search Query (via grep)

**Input:**

```json
{
  "grep": "metadata"
}
{
  "grep": "extract"
}
```

**Expected:**

- Returns files where content matches the search term (case-insensitive)
- e.g., "metadata" should match metadata-extractor-transformer

### Test 1.6: Discover by Exact Name (via grep)

**Input:**

```json
{
  "grep": "metadataExtractorTransformer"
}
{
  "grep": "fileScannerBroker"
}
```

**Expected:**

- Returns files containing the function name
- Use grep for exact name matching

### Test 1.7: Combined Filters (glob + grep)

**Input:**

```json
{
  "glob": "packages/mcp/src/transformers/**",
  "grep": "file"
}
```

**Expected:**

- All filters applied: glob restricts to path AND grep matches content containing "file"

### Test 1.8: Files Without Metadata

**Input:**

```json
{
  "glob": "packages/mcp/src/statics/**"
}
```

**Expected:**

- Files without PURPOSE/USAGE comments still returned
- purpose and usage fields should be undefined
- signature should still be extracted if pattern matches

### Test 1.9: Exclude Files Without Exports

**Input:** Scan any directory
**Expected:**

- Files without exported functions should NOT appear in results
- Only files with `export const` or `export function` are included

### Test 1.10: Multi-Dot Files Handling

**Input:**

```json
{
  "glob": "packages/mcp/src/transformers/**"
}
```

**Expected:**

- Implementation files (e.g., `metadata-extractor-transformer.ts`) appear in main results
- Multi-dot files (.test.ts, .proxy.ts) do NOT appear in main results
- Each implementation file's `relatedFiles` array contains associated multi-dot files:
    - `metadata-extractor-transformer.ts` → relatedFiles:
      `["...metadata-extractor-transformer.proxy.ts", "...metadata-extractor-transformer.test.ts"]`
- relatedFiles are sorted alphabetically
- Files with no related files have `relatedFiles: []`

**Example Response:**

```json
{
  "results": [
    {
      "name": "metadata-extractor-transformer",
      "path": "/path/to/metadata-extractor-transformer.ts",
      "type": "transformer",
      "purpose": "Extracts structured metadata...",
      "relatedFiles": [
        "/path/to/metadata-extractor-transformer.proxy.ts",
        "/path/to/metadata-extractor-transformer.test.ts"
      ]
    }
  ],
  "count": 1
}
```

---

## 2. Tool: `get-architecture`

### Test 3.1: Get Full Architecture Overview

**Input:**

```json
{}
```

**Expected Output Structure:**

```markdown
# Architecture Overview

## Folder Types

| Folder | Purpose | Depth | When to Use |
|--------|---------|-------|-------------|

[Table with all folder types sorted by depth]

## Architecture Layer Diagram
```

[Dependency hierarchy tree]

```

## Decision Tree: Where Does Code Go?
```

[Numbered decision tree]

```

## Critical Rules Summary
[Never/Always rules]
```

**Verification:**

- All 14 folder types present (statics, contracts, guards, transformers, errors, flows, adapters, middleware, brokers,
  bindings, state, responders, widgets, startup)
- Sorted by folder depth, then alphabetically
- Decision tree excludes assets/migrations
- Layer diagram shows dependency relationships
- Critical rules include ❌ and ✅ sections

---

## 3. Tool: `get-folder-detail`

### Test 4.1: Get Details for Each Folder Type

**Test each folderType separately:**

```json
{
  "folderType": "statics"
}
{
  "folderType": "contracts"
}
{
  "folderType": "guards"
}
{
  "folderType": "transformers"
}
{
  "folderType": "errors"
}
{
  "folderType": "flows"
}
{
  "folderType": "adapters"
}
{
  "folderType": "middleware"
}
{
  "folderType": "brokers"
}
{
  "folderType": "bindings"
}
{
  "folderType": "state"
}
{
  "folderType": "responders"
}
{
  "folderType": "widgets"
}
{
  "folderType": "startup"
}
```

**Expected Structure for Each:**

```markdown
# {folderType}/ Folder Type

## Purpose

[Purpose description]

## File Structure

**Pattern:** `...`
**Folder Depth:** N level(s)

## Naming Conventions

**File Suffix:** `...`
**Export Suffix:** `...` (camelCase/kebab-case)

## Import Rules

[Can import from list or restrictions]

## Required Files

**Proxy Required:** Yes/No

- Implementation: ...
- Test: ...
- Proxy: ... (if required)

## Special Features

[Layer files, regex, ad-hoc types info]

## Critical Constraints

[Specific constraints for this folder type]

## Learn More

[Reference to standards]
```

### Test 4.2: Folder Types Without Export Suffix

**Input:**

```json
{
  "folderType": "startup"
}
```

**Expected:**

- Export Suffix section should be omitted (startup files don't export)

### Test 4.3: Folder Types With Multiple Suffixes

**Input:**

```json
{
  "folderType": "contracts"
}
```

**Expected:**

- If folder accepts multiple suffixes (e.g., `-contract.ts` or `-stub.ts`), display them with "or"

### Test 4.4: Folders Allowing Layer Files

**Input:**

```json
{
  "folderType": "brokers"
}
```

**Expected:**

- Special Features should mention "Layer Files Allowed: Yes"

### Test 4.5: Invalid Folder Type

**Input:**

```json
{
  "folderType": "invalid-folder"
}
```

**Expected:**

```markdown
# Unknown Folder Type: invalid-folder

No configuration found for this folder type.
```

---

## 4. Tool: `get-syntax-rules`

### Test 5.1: Get Universal Syntax Rules

**Input:**

```json
{}
```

**Expected:**

- Returns formatted markdown with all syntax rules
- Should include sections like:
    - File Metadata (PURPOSE/USAGE)
    - Naming Conventions
    - Type Safety
    - Error Handling
    - Promise Handling
    - Loop Control
    - Function Exports
    - CLI Output
    - Performance
    - Summary Checklist

**Verification:**

- All sections present and properly formatted
- Code examples included where applicable
- ❌ and ✅ examples for each rule

---

## 5. Error Handling & Edge Cases

### Test 6.1: Missing Required Parameters

**Input:**

```json
{}
```

(Call with no glob or grep params)

**Expected:**

- Should return validation error

### Test 6.2: Invalid Tool Name

**Via MCP protocol, call tool:** `invalid-tool-name`
**Expected:**

- Error: "Unknown tool: invalid-tool-name"

### Test 6.3: Large Result Sets

**Input:**

```json
{
  "glob": "packages/*/src/**"
}
```

**Expected:**

- Should handle large result sets without crashing
- Results should be consistently sorted
- Response time should be reasonable (<10s)

### Test 6.4: Empty Results

**Input:**

```json
{
  "grep": "nonexistent-pattern-xyz123"
}
```

**Expected:**

- Returns `{ "results": [], "count": 0 }`
- No errors

### Test 6.5: Files Without Signatures

**Input:** Discover files that don't match signature extraction pattern
**Expected:**

- Files still returned
- signature field is undefined
- Other metadata still present

---

## 6. MCP Protocol Tests

### Test 7.1: List Tools

**MCP Request:** `ListToolsRequest`
**Expected Response:**

```json
{
  "tools": [
    {
      "name": "discover",
      "description": "...",
      "inputSchema": {
        ...
      }
    },
    {
      "name": "get-architecture",
      "description": "...",
      "inputSchema": {
        ...
      }
    },
    {
      "name": "get-folder-detail",
      "description": "...",
      "inputSchema": {
        ...
      }
    },
    {
      "name": "get-syntax-rules",
      "description": "...",
      "inputSchema": {
        ...
      }
    }
  ]
}
```

### Test 7.2: Call Tool Response Format

**For any tool call, verify:**

- Response has `content` array
- Content has `type: "text"`
- For discover: text is valid JSON
- For architecture/folder-detail/syntax-rules: text is valid markdown

### Test 7.3: Server Initialization

**Expected:**

- Server name: `@dungeonmaster/mcp`
- Server version: `0.1.0`
- Capabilities: `{ tools: {} }`
- Transport: stdio

---

## 7. Performance Tests

### Test 8.1: Startup Time

**Expected:**

- Server starts within 500ms (per mcpServerStatics.timeouts.startupMs)

### Test 8.2: Request Timeout

**Expected:**

- Requests complete within 5000ms (per mcpServerStatics.timeouts.requestMs)

### Test 8.3: Concurrent Requests

**Test:** Make multiple discover calls in parallel
**Expected:**

- All requests complete successfully
- No race conditions or data corruption

---

## Testing Checklist

Use this checklist when manually testing:

- [ ] All 5 tools are listed via ListTools
- [ ] `discover` returns results with glob pattern
- [ ] `discover` filters by glob correctly
- [ ] `discover` filters by grep correctly
- [ ] `discover` supports verbose mode
- [ ] `discover` supports context parameter
- [ ] **Multi-dot files (.test.ts, .proxy.ts) are excluded from main results**
- [ ] **relatedFiles array contains associated multi-dot files**
- [ ] **relatedFiles are sorted alphabetically**
- [ ] **Files without related files have empty relatedFiles array**
- [ ] `get-architecture` returns full markdown overview
- [ ] `get-folder-detail` works for all 14 folder types
- [ ] `get-folder-detail` handles invalid folder types gracefully
- [ ] `get-syntax-rules` returns complete rules
- [ ] Invalid tool names return proper errors
- [ ] Large result sets handled properly
- [ ] Empty results return count: 0
- [ ] Server responds within timeout limits
- [ ] Metadata extraction works (PURPOSE/USAGE)
- [ ] Signature extraction works
- [ ] Files without exports are excluded

---

**REMEMBER:** Restart the MCP server after any code changes before testing!
