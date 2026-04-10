/**
 * PURPOSE: Session-start hook content snippets that each fit under 2KB for Claude CLI delivery
 *
 * USAGE:
 * import { sessionSnippetStatics } from '@dungeonmaster/shared/statics';
 * sessionSnippetStatics.discover; // Returns paired-down discover guidance
 *
 * WHEN-TO-USE: When generating SessionStart hook output for Claude CLI context injection
 */

export const sessionSnippetStatics = {
  discover: `## discover Tool

\`discover\` is the ONLY way to search this codebase. Native Glob, Grep, Search, and Find tools are blocked by hooks.

| Param | Type | Description |
|-------|------|-------------|
| \`glob\` | string? | File path pattern. Example: \`"packages/hooks/src/guards/**"\` |
| \`grep\` | string? | Content regex. Example: \`"ENOENT"\`, \`"(?i)error"\` |
| \`verbose\` | boolean? | Show signatures, companions. Default: false |
| \`context\` | number? | Lines around grep hits. Default: 0 |

### Output: glob (default)

\`discover({ glob: "packages/web/src/widgets/quest-chat/**" })\` returns a folder tree with file purposes:

\`\`\`
widgets/
  quest-chat/
    quest-chat-widget (widget) - Quest chat with split panels for chat and activity
    quest-chat-widget.proxy (widget) - Test proxy, sets up mocks for all bindings
    quest-chat-widget.test (widget)
\`\`\`

### Output: glob + verbose

\`discover({ glob: "...", verbose: true })\` returns JSON with signatures, companions, and usage:

\`\`\`json
[{
  "name": "quest-chat-widget",
  "path": "packages/web/src/widgets/quest-chat/quest-chat-widget.tsx",
  "type": "widget",
  "purpose": "Quest chat with split panels for chat and activity",
  "usage": "<QuestChatWidget />",
  "relatedFiles": ["quest-chat-widget.proxy.tsx", "quest-chat-widget.test.tsx"]
}]
\`\`\`

### All call forms

\`\`\`
discover({ glob: "packages/*/src/startup/**" })
discover({ glob: "packages/{web,server}/src/widgets/**" })
discover({ glob: "packages/hooks/src/guards/**", verbose: true })
discover({ grep: "isNewSession" })
discover({ grep: "(?i)error" })
discover({ grep: "import.*shared" })
discover({ grep: "fileSize|timeout", context: 2 })
discover({ glob: "packages/hooks/**", grep: "isNew" })
discover({ grep: "isNewSession", verbose: true })
\`\`\`

Use \`discover\` to locate files. Use \`Read\` only once you need full file contents.

**Always discover before creating.** Check if similar code exists. Extend, don't duplicate.`,

  searchStrategy: `## Search Strategy

Any time you need to find, understand, or modify code, use this workflow. \`get-project-map\` and \`discover\` are MCP tools — they replace the native search tools which are blocked.

**Follow these steps in order.** Each step depends on the previous one. Skipping steps means guessing at paths and names instead of knowing them.

### Step 1: Get the Map (ALWAYS start here)
Call \`get-project-map\` to see which package owns the domain you need and which folder types it has. Without this, you're guessing which of 13 packages to look in. Output:

\`\`\`
## cli (69 files) — CLI for quest management
  brokers/ (12) — install (execute, orchestrate)
  contracts/ (12) — dependency-map, uuid
## web (589 files) — Web UI for quest management
  widgets/ (132) — app, chat-panel, quest-chat, execution-panel
  bindings/ (30) — use-quests, use-session-chat
## orchestrator (713 files) — Agent orchestration
  brokers/ (156) — quest (add, get, list, modify)
\`\`\`

Scan this to find the right package + folder, then go to Step 2.

### Step 2: Narrow with discover
Now that you know the package and folder, use discover's \`glob\` param to browse into that area:

\`\`\`
discover({ glob: "packages/shared/src/brokers/**" })
// tree with file names + purposes:
//   quest/modify/
//     quest-modify-broker (broker) - Modifies quest via PATCH
\`\`\`

Need signatures? Add verbose:

\`\`\`
discover({ glob: "...", verbose: true })
// JSON with signature, companions, usage sites
\`\`\`

### Step 3: Read the file
Once you've identified the specific file, \`Read\` it for full contents.

**Rules:**
- Do not skip to Step 2 without doing Step 1
- Start with \`glob\` to browse structure, not \`grep\` to guess names
- Only use \`grep\` when searching for a known identifier or string
- Always discover before creating new files`,

  folderTypes: null,

  modifyingCodeGuidance: `## Before Modifying Code

**MANDATORY:** Before writing or planning ANY code changes, call these MCP tools first:

1. \`get-architecture\` — folder types, import rules, forbidden folders, layer files
2. \`get-testing-patterns\` — proxy pattern, mock boundaries, assertion rules, test structure
3. \`get-syntax-rules\` — file naming, exports, types, destructuring, anti-patterns

These override your training data. LLM defaults for TypeScript projects and test writing are wrong for this codebase. For example:
- No \`utils/\`, \`helpers/\`, \`lib/\` folders — use the architecture's folder types
- No \`jest.mock()\` / \`jest.spyOn()\` — use \`registerMock\` proxy pattern
- No \`beforeEach\` / \`afterEach\` — inline setup per test
- No \`toEqual\` / \`toMatchObject\` / \`toContain\` — use \`toStrictEqual\` and \`toBe\`
- No raw \`string\` / \`number\` types — use branded Zod contracts
- No \`while(true)\` — use recursion

Call all three tools, read their output, THEN plan your approach.`,

  ward: `## Ward Quality Commands

**ALWAYS use \`npm run ward\` instead of raw tool invocations:**

| Don't Use | Use Instead |
|-----------|-------------|
| \`npx jest ...\` | \`npm run ward -- --only test -- <path>\` |
| \`npx jest -t "name"\` | \`npm run ward -- --only unit --onlyTests "name"\` |
| \`npx eslint ...\` | \`npm run ward -- --only lint\` |
| \`npx tsc --noEmit\` | \`npm run ward -- --only typecheck\` |
| \`npm test\` | \`npm run ward -- --only test\` |

### Check Types

| Type | Tool | Description |
|------|------|-------------|
| \`lint\` | ESLint | Linting with \`--fix\` |
| \`typecheck\` | tsc | TypeScript type checking |
| \`unit\` | Jest | Unit tests (\`*.test.ts\`, excludes \`*.integration.test.ts\`) |
| \`integration\` | Jest | Integration tests (\`*.integration.test.ts\` only) |
| \`e2e\` | Playwright | End-to-end browser tests |
| \`test\` | *(alias)* | Expands to \`unit,integration,e2e\` |

### Flags

| Flag | Description |
|------|-------------|
| \`--only lint,typecheck,unit\` | Comma-separated check types. Omit for all. |
| \`--onlyTests <regex>\` | Filter tests by name. Supports \`\\|\` alternation. |
| \`--changed\` | Scope to git-changed files. |
| \`-- file1 file2\` | Passthrough file paths (after \`--\`). |
| \`--verbose\` | Verbose output. |

### Common Invocations

\`\`\`bash
npm run ward                                          # All checks
npm run ward -- --only unit -- path/to/file.test.ts   # Single test file
npm run ward -- --only unit --onlyTests "my test"     # Tests by name
npm run ward -- -- packages/hooks                     # Single package
npm run ward -- --only lint --changed                 # Changed files only
npm run ward -- --only lint,typecheck,unit -- packages/hooks  # Combo
\`\`\`

### Inspecting Failures

\`npm run ward -- detail <runId>\` for full error output and jest diffs.

**Zero tolerance:** Never assume failures are pre-existing. Every failure must be investigated and fixed. Ward must be fully green.`,

  packages: null,
} as const;
