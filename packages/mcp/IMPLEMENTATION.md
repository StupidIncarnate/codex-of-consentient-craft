# MCP Discovery Server - Implementation Guide

## Overview

This document provides step-by-step instructions for completing the MCP discovery server implementation.

## Architecture & Data Flow

```
LLM calls MCP tool
    ↓
discover-broker (orchestrates based on type)
    ↓
    ├─→ [type: "files"] → file-scanner-broker
    │       ↓
    │       ├─→ fs-glob-adapter (find .ts/.tsx files)
    │       ├─→ fs-read-file-adapter (read file contents)
    │       ├─→ metadata-extractor-transformer (parse comments)
    │       ├─→ signature-extractor-transformer (extract TS signatures)
    │       └─→ file-type-detector-transformer (detect broker/widget/etc)
    │
    └─→ [type: "standards"] → standards-parser-broker
            ↓
            ├─→ fs-glob-adapter (find .md files)
            └─→ fs-read-file-adapter (read markdown)
```

## Components to Build

### 1. Adapters (I/O Boundary)

#### `src/adapters/fs-glob/fs-glob-adapter.ts`

**Purpose:** Find files matching glob patterns using the `glob` npm package.

**Signature:**

```typescript
export const fsGlobAdapter = async ({
                                        pattern,
                                        cwd,
                                    }: {
    pattern: GlobPattern;
    cwd?: AbsolutePath;
}): Promise<FilePath[]>
```

**Implementation Steps:**

1. Import `glob` from npm package `glob`
2. Call `glob(pattern, { cwd, absolute: true })`
3. Parse results through `filePathContract` array
4. Return branded FilePath array

**Test Cases:**

- VALID: `{pattern: "**/*.ts"}` → returns array of .ts files
- VALID: `{pattern: "**/*.tsx"}` → returns array of .tsx files
- VALID: `{pattern: "src/guards/**/*.ts"}` → returns only guard files
- EMPTY: `{pattern: "nonexistent/**"}` → returns empty array

**Proxy:**

```typescript
export const fsGlobAdapterProxy = () => {
    jest.mock('glob');
    const mockGlob = jest.mocked(glob);

    return {
        returns: ({pattern, files}: { pattern: GlobPattern; files: FilePath[] }) => {
            mockGlob.mockResolvedValueOnce(files);
        },
    };
};
```

---

#### `src/adapters/fs-read-file/fs-read-file-adapter.ts`

**Purpose:** Read file contents from filesystem using `fs/promises`.

**Signature:**

```typescript
export const fsReadFileAdapter = async ({
                                            filepath,
                                        }: {
    filepath: FilePath;
}): Promise<FileContents>
```

**Implementation Steps:**

1. Import `readFile` from `fs/promises`
2. Call `readFile(filepath, 'utf8')`
3. Parse result through `fileContentsContract`
4. Return branded FileContents

**Test Cases:**

- VALID: `{filepath: "/path/to/file.ts"}` → returns file contents
- ERROR: `{filepath: "/nonexistent"}` → throws error

**Proxy:**

```typescript
export const fsReadFileAdapterProxy = () => {
    jest.mock('fs/promises');
    const mockReadFile = jest.mocked(readFile);

    return {
        returns: ({filepath, contents}: { filepath: FilePath; contents: FileContents }) => {
            mockReadFile.mockResolvedValueOnce(contents);
        },
        throws: ({filepath, error}: { filepath: FilePath; error: Error }) => {
            mockReadFile.mockRejectedValueOnce(error);
        },
    };
};
```

---

### 2. Brokers (Business Logic)

#### `src/brokers/file-scanner/file-scanner-broker.ts`

**Purpose:** Scan directory tree for files and extract their metadata.

**Signature:**

```typescript
export const fileScannerBroker = async ({
                                            path,
                                            fileType,
                                            search,
                                            name,
                                        }: {
    path?: FilePath;
    fileType?: FileType;
    search?: SearchQuery;
    name?: FileName;
}): Promise<FileMetadata[]>
```

**Implementation Steps:**

1. **Find files:**
   ```typescript
   const pattern = path
     ? `${path}/**/*.{ts,tsx}`
     : '**/*.{ts,tsx}';

   const files = await fsGlobAdapter({
     pattern,
     cwd: process.cwd()
   });
   ```

2. **Filter by file type (if provided):**
   ```typescript
   const filteredFiles = fileType
     ? files.filter(f => fileTypeDetectorTransformer({ filepath: f }) === fileType)
     : files;
   ```

3. **For each file:**
   ```typescript
   const results: FileMetadata[] = [];

   for (const filepath of filteredFiles) {
     // Read file
     const contents = await fsReadFileAdapter({ filepath });

     // Extract metadata
     const metadata = metadataExtractorTransformer({ fileContents: contents });
     if (!metadata) continue; // Skip files without metadata

     // Extract signature
     const signature = signatureExtractorTransformer({ fileContents: contents });
     if (!signature) continue; // Skip files without function exports

     // Detect file type
     const detectedFileType = fileTypeDetectorTransformer({ filepath });

     // Extract function name from filepath
     const functionName = filepath.split('/').pop()?.replace(/\.tsx?$/, '') ?? '';

     results.push({
       name: functionName,
       path: filepath,
       fileType: detectedFileType,
       purpose: metadata.purpose,
       signature,
       usage: metadata.usage,
       related: metadata.related,
       metadata: metadata.metadata,
     });
   }
   ```

4. **Filter by name (if provided):**
   ```typescript
   if (name) {
     return results.filter(r => r.name === name);
   }
   ```

5. **Filter by search (if provided):**
   ```typescript
   if (search) {
     return results.filter(r =>
       r.purpose.toLowerCase().includes(search.toLowerCase()) ||
       r.name.toLowerCase().includes(search.toLowerCase())
     );
   }
   ```

6. **Return results**

**Test Cases:**

- VALID: `{path: "packages/eslint-plugin/src/guards"}` → returns all guards with metadata
- VALID: `{fileType: "broker"}` → returns only brokers
- VALID: `{search: "user"}` → returns files with "user" in purpose or name
- VALID: `{name: "isTestFileGuard"}` → returns single specific guard
- EMPTY: `{path: "nonexistent"}` → returns empty array

**Proxy:**

```typescript
export const fileScannerBrokerProxy = () => {
    const globProxy = fsGlobAdapterProxy();
    const readFileProxy = fsReadFileAdapterProxy();

    return {
        setupFileWithMetadata: ({
                                    filepath,
                                    contents,
                                    metadata
                                }: {
            filepath: FilePath;
            contents: FileContents;
            metadata: FileMetadata;
        }) => {
            globProxy.returns({pattern: '**/*.ts', files: [filepath]});
            readFileProxy.returns({filepath, contents});
        },
    };
};
```

---

#### `src/brokers/standards-parser/standards-parser-broker.ts`

**Purpose:** Parse markdown files into addressable sections.

**Signature:**

```typescript
export const standardsParserBroker = async ({
                                                section,
                                            }: {
    section?: StandardsSection;
}): Promise<StandardsSection[]>
```

**Implementation Steps:**

1. **Find markdown files:**
   ```typescript
   const files = await fsGlobAdapter({
     pattern: 'packages/standards/**/*.md',
     cwd: process.cwd()
   });
   ```

2. **For each markdown file:**
   ```typescript
   const sections: StandardsSection[] = [];

   for (const filepath of files) {
     const contents = await fsReadFileAdapter({ filepath });

     // Split by ## headers
     const headerPattern = /^##\s+(.+)$/gm;
     const matches = [...contents.matchAll(headerPattern)];

     for (let i = 0; i < matches.length; i++) {
       const currentMatch = matches[i];
       const nextMatch = matches[i + 1];

       const headerText = currentMatch[1] ?? '';
       const startIndex = currentMatch.index ?? 0;
       const endIndex = nextMatch?.index ?? contents.length;

       const sectionContent = contents.slice(startIndex, endIndex);

       // Build section path: "filename/header-slug"
       const filename = filepath.split('/').pop()?.replace('.md', '') ?? '';
       const headerSlug = headerText.toLowerCase().replace(/\s+/g, '-');
       const sectionPath = `${filename}/${headerSlug}`;

       sections.push({
         section: sectionPath,
         content: sectionContent,
         path: `${filepath}#${headerSlug}`,
       });
     }
   }
   ```

3. **Filter by section (if provided):**
   ```typescript
   if (section) {
     return sections.filter(s => s.section === section);
   }
   ```

4. **Return sections**

**Test Cases:**

- VALID: `{}` → returns all sections from all markdown files
- VALID: `{section: "testing-standards/proxy-architecture"}` → returns specific section
- EMPTY: `{section: "nonexistent"}` → returns empty array

**Proxy:**

```typescript
export const standardsParserBrokerProxy = () => {
    const globProxy = fsGlobAdapterProxy();
    const readFileProxy = fsReadFileAdapterProxy();

    return {
        setupMarkdownFile: ({
                                filepath,
                                contents
                            }: {
            filepath: FilePath;
            contents: FileContents;
        }) => {
            globProxy.returns({
                pattern: 'packages/standards/**/*.md',
                files: [filepath]
            });
            readFileProxy.returns({filepath, contents});
        },
    };
};
```

---

#### `src/brokers/discover/discover-broker.ts`

**Purpose:** Main orchestration - routes to file-scanner or standards-parser based on input type.

**Signature:**

```typescript
export const discoverBroker = async ({
                                         input,
                                     }: {
    input: DiscoverInput;
}): Promise<{ results: FileMetadata[] | StandardsSection[]; count: number }>
```

**Implementation Steps:**

1. **Validate input:**
   ```typescript
   const validated = discoverInputContract.parse(input);
   ```

2. **Route based on type:**
   ```typescript
   if (validated.type === 'files') {
     const results = await fileScannerBroker({
       path: validated.path,
       fileType: validated.fileType,
       search: validated.search,
       name: validated.name,
     });

     return {
       results,
       count: results.length,
     };
   }

   if (validated.type === 'standards') {
     const results = await standardsParserBroker({
       section: validated.section,
     });

     return {
       results,
       count: results.length,
     };
   }
   ```

**Test Cases:**

- VALID: `{type: "files", fileType: "broker"}` → calls file-scanner, returns brokers
- VALID: `{type: "standards", section: "testing/assertions"}` → calls standards-parser
- ERROR: `{type: "invalid"}` → throws validation error

**Proxy:**

```typescript
export const discoverBrokerProxy = () => {
    const fileScannerProxy = fileScannerBrokerProxy();
    const standardsParserProxy = standardsParserBrokerProxy();

    return {
        setupFileDiscovery: ({metadata}: { metadata: FileMetadata[] }) => {
            fileScannerProxy.setupFileWithMetadata({...});
        },
        setupStandardsDiscovery: ({sections}: { sections: StandardsSection[] }) => {
            standardsParserProxy.setupMarkdownFile({...});
        },
    };
};
```

---

### 3. Guards

#### `src/guards/has-metadata-comment/has-metadata-comment-guard.ts`

**Purpose:** Validates that a file has the required metadata comment structure.

**Signature:**

```typescript
export const hasMetadataCommentGuard = ({
                                            fileContents,
                                        }: {
    fileContents?: FileContents;
}): boolean
```

**Implementation:**

```typescript
if (!fileContents) return false;

// Check for PURPOSE, USAGE, RELATED
return /\/\*\*\s*\n\s*\*\s*PURPOSE:/.test(fileContents) &&
    /\*\s*USAGE:/.test(fileContents) &&
    /\*\s*RELATED:/.test(fileContents);
```

**Test Cases:**

- VALID: `{fileContents: "/** PURPOSE: ...\n * USAGE: ...\n * RELATED: ..."}` → returns true
- INVALID: `{fileContents: "/** Only purpose */"}` → returns false
- EMPTY: `{fileContents: undefined}` → returns false

---

### 4. MCP Server

#### `src/startup/start-mcp-server.ts`

**Purpose:** Initialize MCP server and register the `discover` tool.

**Implementation:**

```typescript
import {Server} from '@modelcontextprotocol/sdk/server/index.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {discoverBroker} from '../brokers/discover/discover-broker.js';

export const startMcpServer = async (): Promise<void> => {
    const server = new Server(
        {
            name: '@questmaestro/mcp',
            version: '0.1.0',
        },
        {
            capabilities: {
                tools: {},
            },
        },
    );

    // List available tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'discover',
                description: 'Discover utilities, brokers, standards across the codebase',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['files', 'standards'],
                            description: 'Type of discovery: files or standards',
                        },
                        path: {
                            type: 'string',
                            description: 'Path to search (for files)',
                        },
                        fileType: {
                            type: 'string',
                            description: 'File type to filter (broker, widget, guard, etc.)',
                        },
                        search: {
                            type: 'string',
                            description: 'Search query',
                        },
                        name: {
                            type: 'string',
                            description: 'Specific file name',
                        },
                        section: {
                            type: 'string',
                            description: 'Standards section path (for standards)',
                        },
                    },
                    required: ['type'],
                },
            },
        ],
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name === 'discover') {
            const result = await discoverBroker({
                input: request.params.arguments,
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${request.params.name}`);
    });

    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
};
```

#### `src/index.ts`

```typescript
import {startMcpServer} from './startup/start-mcp-server.js';

startMcpServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('MCP server error:', error);
    process.exit(1);
});
```

---

## Testing Strategy

### Unit Tests

- Each transformer has tests (already done)
- Each adapter mocks npm dependencies
- Each broker delegates to adapter/transformer proxies

### Integration Tests

#### `src/brokers/file-scanner/file-scanner-broker.integration.test.ts`

Test against real repo files:

```typescript
it('VALID: scans actual guards in repo => extracts metadata', async () => {
    const results = await fileScannerBroker({
        path: FilePathStub({value: 'packages/eslint-plugin/src/guards/is-test-file'}),
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.name).toBe('isTestFileGuard');
    expect(results[0]?.purpose).toContain('test file');
});
```

#### `src/index.integration.test.ts`

End-to-end MCP server test:

```typescript
it('VALID: MCP server responds to discover tool call', async () => {
    // Mock MCP protocol
    const result = await discoverBroker({
        input: DiscoverInputStub({type: 'files', fileType: 'guard'}),
    });

    expect(result.count).toBeGreaterThan(0);
    expect(result.results[0]).toHaveProperty('purpose');
});
```

---

## Contracts Reference

All contracts are already created. Here's how to use them:

```typescript
// Import contracts
import {filePathContract} from './contracts/file-path/file-path-contract';
import type {FilePath} from './contracts/file-path/file-path-contract';

// Import stubs for tests
import {FilePathStub} from './contracts/file-path/file-path.stub';

// Parse/validate data
const filepath = filePathContract.parse('/path/to/file.ts');

// Create test data
const testPath = FilePathStub({value: '/test/path'});
```

---

## File Checklist

### To Build (8 files + tests + proxies = ~24 files)

**Adapters (4 files):**

- [ ] `fs-glob-adapter.ts`
- [ ] `fs-glob-adapter.test.ts`
- [ ] `fs-read-file-adapter.ts`
- [ ] `fs-read-file-adapter.test.ts`

**Brokers (9 files):**

- [ ] `file-scanner-broker.ts`
- [ ] `file-scanner-broker.proxy.ts`
- [ ] `file-scanner-broker.test.ts`
- [ ] `standards-parser-broker.ts`
- [ ] `standards-parser-broker.proxy.ts`
- [ ] `standards-parser-broker.test.ts`
- [ ] `discover-broker.ts`
- [ ] `discover-broker.proxy.ts`
- [ ] `discover-broker.test.ts`

**Guards (3 files):**

- [ ] `has-metadata-comment-guard.ts`
- [ ] `has-metadata-comment-guard.proxy.ts`
- [ ] `has-metadata-comment-guard.test.ts`

**MCP Server (2 files):**

- [ ] `start-mcp-server.ts`
- [ ] `index.ts`

**Integration Tests (2 files):**

- [ ] `file-scanner-broker.integration.test.ts`
- [ ] `index.integration.test.ts`

---

## Deployment

After implementation is complete:

1. **Build the package:**
   ```bash
   cd packages/mcp
   npm run build
   ```

2. **Configure Claude Code:**
   Add to Claude Code MCP settings:
   ```json
   {
     "mcpServers": {
       "questmaestro-discovery": {
         "command": "node",
         "args": ["/path/to/codex/packages/mcp/dist/index.js"]
       }
     }
   }
   ```

3. **Test in Claude Code:**
   ```
   Use the discover tool to find all guards in eslint-plugin
   ```

---

## Migration Plan

1. **Complete implementation** (build remaining 24 files)
2. **Add metadata to 5 key files** as examples:
    - `isTestFileGuard`
    - `hasFileSuffixGuard`
    - `fileBasenameTransformer`
    - `userFetchBroker` (if exists)
    - `metadataExtractorTransformer` (dogfooding)

3. **Create ESLint rule** (separate package):
    - Rule: `enforce-metadata-comments`
    - Checks for PURPOSE, USAGE, RELATED in exported functions
    - Reports missing metadata

4. **Gradual rollout:**
    - Week 1: Add metadata to top 20 most-used utilities
    - Week 2: Enforce rule on new files only
    - Week 3: Fix existing files in batches
    - Week 4: Enforce rule on all files

---

## Success Metrics

- LLMs can discover utilities without reinventing
- 90%+ of files have metadata comments
- ESLint enforcement prevents new files without metadata
- Discovery tool response time < 1 second for typical queries
