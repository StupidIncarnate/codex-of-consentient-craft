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
| \`grep\` | string? | Content regex. Identifier patterns (2+ tokens, no metachars) match across kebab/snake/camel/Pascal by default. Single tokens stay literal. |
| \`verbose\` | boolean? | Show signatures, companions. Default: false |
| \`context\` | number? | Lines around grep hits. Default: 0 |
| \`strict\` | boolean? | Disable cross-convention matching. Default: false |

### Output: glob (default)

\`discover({ glob: "packages/web/src/widgets/quest-chat/**" })\` returns a folder tree:

\`\`\`
widgets/
  quest-chat/
    quest-chat-widget (widget) - Quest chat with split panels
    quest-chat-widget.proxy (widget) - Test proxy
    quest-chat-widget.test (widget)
\`\`\`

\`verbose: true\` returns JSON with signatures, companions, and usage instead.

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
discover({ grep: "OrchestrationEventType" })  // cross-convention default
discover({ grep: "OrchestrationEventType", strict: true })  // exact-match
\`\`\`

Use \`discover\` to locate files. Use \`Read\` only once you need full file contents.

**Always discover before creating.** Check if similar code exists. Extend, don't duplicate.`,

  searchStrategy: `## Search Strategy

Before searching, exploring, or modifying code, follow this order.

### Step 1: Identify candidate package(s)
Pick the package(s) the task touches. The available packages are listed in the \`dungeonmaster-packages\` snippet that loads at session start (cli, hooks, mcp, orchestrator, server, web, ward, tooling, shared, etc.). If you have no guess, read the task again — it usually names a feature or layer that maps to one or two packages.

### Step 2: \`get-project-map({ packages: [...] })\` for those slices
Pass the candidate package names. Required arg, min 1. Returns connection-graph slices for just those packages:

\`\`\`
get-project-map({ packages: ['mcp', 'shared'] })

# mcp [mcp-server]
## Boot
startup/start-mcp-server
  ↳ flows/{architecture, quest, interaction, mcp-server}
…

# shared [library]   ← library packages get filtered out (use get-project-inventory for them)
\`\`\`

**Project-map covers only wired code** (flows, responders, brokers, adapters, state, routes). For \`contracts/\`, \`transformers/\`, \`guards/\`, \`statics/\`, \`errors/\`, call \`get-project-inventory({ packageName })\` — these aren't in the graph, and \`discover\` globs miss on naming variants (\`email/\` vs \`email-address/\`). Inventory gives the deterministic full list.

Read the slice or inventory. Identify which folder type owns what you need. THEN proceed to Step 3.

### Step 3: \`discover\` with a targeted glob
Glob into the specific area you identified:

\`\`\`
discover({ glob: "packages/mcp/src/responders/architecture/**" })
\`\`\`

Add \`verbose: true\` for signatures. Add \`grep\` only for known identifiers.

### Step 4: \`Read\` the specific file
Once discover found the file, Read it for full contents.

**Rules:**
- \`get-project-map\` errors on unknown package names — list valid names is in the error message.
- Start with glob, not grep — grep guesses names, glob browses structure.
- Always discover before creating new files.`,

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
