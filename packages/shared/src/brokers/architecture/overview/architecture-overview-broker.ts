/**
 * PURPOSE: Generate orientation map for LLMs entering the repo with folder types, architecture layers, decision tree, and critical rules
 *
 * USAGE:
 * const markdown = architectureOverviewBroker();
 * // Returns ContentText markdown with folder types table, layer diagram, decision tree, and critical rules
 *
 * WHEN-TO-USE: When LLMs need a high-level overview of the project structure and architecture
 */
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import {
  folderConfigContract,
  type FolderConfig,
} from '../../../contracts/folder-config/folder-config-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { folderDependencyTreeTransformer } from '../../../transformers/folder-dependency-tree/folder-dependency-tree-transformer';
import { isKeyOfGuard } from '../../../guards/is-key-of/is-key-of-guard';

export const architectureOverviewBroker = (): ContentText => {
  const { hierarchy } = folderDependencyTreeTransformer({
    folderConfigs: folderConfigStatics,
  });

  // Build folder types table using entries sorted by depth
  type FolderKey = keyof typeof folderConfigStatics;
  const unsortedEntries: { key: FolderKey; config: FolderConfig }[] = [];

  for (const key in folderConfigStatics) {
    if (Object.hasOwn(folderConfigStatics, key) && isKeyOfGuard(key, folderConfigStatics)) {
      unsortedEntries.push({
        key,
        config: folderConfigContract.parse(folderConfigStatics[key]),
      });
    }
  }

  const folderEntries = unsortedEntries.sort((a, b) => {
    const depthDiff = a.config.folderDepth - b.config.folderDepth;
    if (depthDiff !== 0) {
      return depthDiff;
    }
    return a.key.localeCompare(b.key);
  });

  const tableHeader = contentTextContract.parse(
    '| Folder | Purpose | Depth | When to Use |\n|--------|---------|-------|-------------|',
  );
  const tableRows: ContentText[] = [tableHeader];

  for (const { key: folderName, config } of folderEntries) {
    tableRows.push(
      contentTextContract.parse(
        `| ${folderName}/ | ${config.meta.purpose} | ${config.folderDepth} | ${config.meta.whenToUse} |`,
      ),
    );
  }

  const folderTypesTable = tableRows.join('\n');

  // Build architecture layer diagram (using hierarchy from transformer)
  const layerDiagram = `\`\`\`
${hierarchy}
\`\`\``;

  // Build decision tree from metadata (using same folder order, excluding non-code folders)
  const decisionTreeLines: ContentText[] = [];
  let decisionIndex = 1;

  for (const { key: folderName, config } of folderEntries) {
    // Skip assets and migrations from decision tree (not code folders)
    if (folderName === 'assets' || folderName === 'migrations') {
      continue;
    }

    decisionTreeLines.push(
      contentTextContract.parse(`${decisionIndex}. ${config.meta.whenToUse} → ${folderName}/`),
    );
    decisionIndex++;
  }

  const decisionTree = contentTextContract.parse(`\`\`\`\n${decisionTreeLines.join('\n')}\n\`\`\``);

  // Build why section
  const whyThisStructure = `LLMs instinctively "squirrel away" code based on training data patterns. This creates chaos with folders like \`utils/\`, \`lib/\`, \`helpers/\`.

This structure forces deterministic organization by:
1. **Eliminating ambiguous folders** (utils, lib, helpers, common)
2. **Using unconventional terms** (brokers, transformers, guards) to bypass LLM training patterns
3. **Explicit import rules** mechanically enforced by ESLint

**If you think "this should go in utils/" → refer to Forbidden Folders table below.**`;

  // Build forbidden folders table
  const forbiddenFolders = `| ❌ FORBIDDEN | ✅ USE INSTEAD | WHY |
|-------------|----------------|-----|
| utils/ | adapters/ or transformers/ | Based on whether it wraps external packages or transforms data |
| lib/ | adapters/ | External package wrappers only |
| helpers/ | guards/ or transformers/ | Boolean functions → guards/, others → transformers/ |
| common/ | Distribute by function | No catch-all folders allowed |
| shared/ | Distribute by function | No catch-all folders allowed |
| core/ | brokers/ | Business logic operations |
| services/ | brokers/ | Business operations |
| repositories/ | brokers/ | Data access operations |
| models/ | contracts/ | Data definitions and validation |
| types/ | contracts/ | All types and interfaces |
| interfaces/ | contracts/ | Type definitions |
| validators/ | contracts/ | Validation schemas only |
| constants/ | statics/ | Immutable values, enums, config objects |
| config/ | statics/ | Static configuration values |
| enums/ | statics/ | Enumerations |
| formatters/ | transformers/ | Data formatting |
| mappers/ | transformers/ | Data mapping |
| converters/ | transformers/ | Data conversion |`;

  // Build extension over creation rules
  const extensionRules = `**Golden Rule:** If a domain file exists, EXTEND it with options - never create variant files.

**Search first using the \`discover\` MCP tool:**
- \`{ glob: "packages/*/src/brokers/**", grep: "user" }\`
- \`{ glob: "packages/*/src/bindings/**" }\`

**If domain exists → MUST extend, not create new**

**When to EXTEND (add options):**
- Adding optional behavior (includeCompany, includeRoles)
- Adding filters (status?: 'active' | 'inactive')
- Adding joins/relations (includeCompany?: boolean)

**When to CREATE NEW:**
- New domain (first payment broker)
- New action (user-delete when only user-fetch exists)
- Different folder type (user-contract, user-broker, use-user-binding)
- Single responsibility violation

**Examples by folder:**
- **Bindings**: Extend with options (includeCompany, includeRoles)
- **Transformers**: Create variants (each output shape = separate file)
- **Widgets**: Extend with props (showCompany, showRoles)
- **Brokers**: Create orchestration brokers, extend bindings with option`;

  // Build code discovery section
  const codeDiscovery = `**\`discover\` is the ONLY way to search this codebase.** System-level Glob, Grep, Search, and Find are ALL locked by hooks and will be blocked. The \`discover\` MCP tool replaces all of them — it wraps glob and grep with structured output (purposes, signatures, related files).

**discover params:**

| Param | Type | Description |
|-------|------|-------------|
| \`glob\` | string? | File path pattern (glob syntax). Example: \`"packages/hooks/src/guards/**"\`, \`"**/*.sql"\` |
| \`grep\` | string? | Content regex pattern. Example: \`"ENOENT"\`, \`"(?i)error"\` |
| \`verbose\` | boolean? | Show full details (signature, usage). Default: false |
| \`context\` | number? | Lines around grep hits. Default: 0 |

**discover finds ANY file type** (TS, JSON, SQL, YAML, MD, etc.) — not just source files.

### When to Use discover vs Read

Pick the right tool for the granularity you need. Here is exactly what each returns:

**1. \`discover({ glob })\` or \`discover({ grep })\` — Orientation / lay of the land**

Use when: finding files, browsing a directory, checking what exists before creating.

Output is a folder tree. Each line is: \`file-name (folder-type) - purpose\`. Reading the output:
- \`(broker)\`, \`(guard)\`, \`(transformer)\` etc. = the folder type the file lives in (see Folder Types table)
- \`.proxy\` = test mock file, \`.test\` = test file
- \`- purpose text\` = extracted from the \`PURPOSE:\` metadata comment at the top of the file

\`\`\`
// discover({ glob: "packages/orchestrator/src/brokers/quest/orchestration-loop/**" })

brokers/
  quest/
    orchestration-loop/
      quest-orchestration-loop-broker (broker) - Drives quest execution by processing work item queue — find ready items, dispatch to role-specific layer brokers
      quest-orchestration-loop-broker.proxy (broker)
      quest-orchestration-loop-broker.test (broker)
      run-chat-layer-broker (broker) - Spawns chaos/glyph agents with streaming, writes sessionId to work item
      run-chat-layer-broker.proxy (broker)
      run-chat-layer-broker.test (broker)
      run-codeweaver-layer-broker (broker) - Executes codeweaver work items via slot manager, maps QuestWorkItemId to SlotManager WorkItemId
      run-codeweaver-layer-broker.proxy (broker)
      run-codeweaver-layer-broker.test (broker)
\`\`\`

With grep, matching lines appear inline under each file:

\`\`\`
// discover({ grep: "questModifyBroker" })

quest/
  modify/
    quest-modify-broker (broker) - Modifies an existing quest by sending a PATCH request
      :14  export const questModifyBroker = async ({
    quest-modify-broker.proxy (broker)
      :9  export const questModifyBrokerProxy = (): {
      :26  import { questModifyBroker } from './quest-modify-broker';
\`\`\`

**2. \`discover({ ..., verbose: true })\` — Signatures, companions, structure**

Use when: you need to see a function signature, check parameter types, verify naming, or see what test/proxy files exist — without reading the full file.

\`\`\`json
// discover({ glob: "packages/orchestrator/src/brokers/quest/orchestration-loop/**", verbose: true })
// Returns structured JSON per file:

[
  {
    "name": "quest-orchestration-loop-broker",
    "path": "packages/orchestrator/src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker.ts",
    "type": "broker",
    "purpose": "Drives quest execution by processing work item queue — find ready items, dispatch to role-specific layer brokers",
    "signature": "export const questOrchestrationLoopBroker = async ({\\n  processId,\\n  questId,\\n  startPath,\\n  onAgentEntry,\\n  abortSignal,\\n  userMessage,\\n}: {\\n  processId: ProcessId;\\n  questId: QuestId;\\n  startPath: FilePath;\\n  onAgentEntry: OnAgentEntryCallback;\\n  abortSignal: AbortSignal;\\n  userMessage?: UserInput;\\n}): Promise<void> =>",
    "relatedFiles": [
      "quest-orchestration-loop-broker.proxy.ts",
      "quest-orchestration-loop-broker.test.ts"
    ]
  },
  {
    "name": "run-ward-layer-broker",
    "path": "packages/orchestrator/src/brokers/quest/orchestration-loop/run-ward-layer-broker.ts",
    "type": "broker",
    "purpose": "Executes ward phase — streams output to web, persists trimmed detail, creates batched spiritmenders on failure",
    "signature": "export const runWardLayerBroker = async ({\\n  questId,\\n  workItem,\\n  startPath,\\n  onAgentEntry,\\n  abortSignal,\\n}: {\\n  questId: QuestId;\\n  workItem: WorkItem;\\n  startPath: FilePath;\\n  onAgentEntry: OnAgentEntryCallback;\\n  abortSignal: AbortSignal;\\n}): Promise<void> =>",
    "relatedFiles": [
      "run-ward-layer-broker.proxy.ts",
      "run-ward-layer-broker.test.ts"
    ]
  }
]
\`\`\`

With grep, adds a \`hits\` array showing matching lines:

\`\`\`json
// discover({ grep: "questModifyBroker", verbose: true })

{
  "name": "run-chat-layer-broker",
  "path": "packages/orchestrator/src/brokers/quest/orchestration-loop/run-chat-layer-broker.ts",
  "type": "broker",
  "purpose": "Spawns chaos/glyph agents with streaming, writes sessionId to work item",
  "hits": [
    { "line": 28, "text": "import { questModifyBroker } from '../modify/quest-modify-broker';" },
    { "line": 94, "text": "await questModifyBroker({" }
  ]
}
\`\`\`

**3. \`Read\` tool — Full file contents**

Use when: you are about to edit a file, need to understand implementation logic, or need the actual code line-by-line. Do NOT use Read to search — use discover first, then Read the specific file you need.

**Parallel tool calls:** When multiple tool calls are independent (no call depends on another's result), batch them
into a single message. This applies to discover, Read, get-folder-detail, and any other tool — not just discover.

\`\`\`
// ✅ CORRECT — 3 independent calls in ONE message (parallel execution)
discover({ glob: "packages/orchestrator/src/brokers/quest/**" })
discover({ glob: "packages/shared/src/contracts/**" })
Read("packages/web/src/widgets/home-content/home-content-widget.tsx")

// ❌ WRONG — 3 sequential messages (3x slower, wastes time)
// Message 1: discover({ glob: "packages/orchestrator/src/brokers/quest/**" })
// Message 2: discover({ glob: "packages/shared/src/contracts/**" })
// Message 3: Read("packages/web/src/widgets/home-content/home-content-widget.tsx")
\`\`\`

**Rule of thumb:** If you're about to make a tool call and the result won't change what other calls you need to make,
batch them together. Only go sequential when call B depends on the result of call A.

**How to search — glob the architecture, don't guess with grep:**

This codebase has known folder types: brokers, guards, transformers, contracts, adapters, widgets, responders, statics. The tree output shows every file with its purpose — that IS your search index. Glob into folder types to see what exists.

\`\`\`
// ✅ Glob a folder type — one call, see the full tree with purposes
discover({ glob: "packages/shared/src/brokers/architecture/**" })
// → tree shows every file + purpose. Pick the one you need, then Read it.

// ✅ Glob to explore a package area you're working in
discover({ glob: "packages/orchestrator/src/brokers/quest/**" })

// ✅ Grep for a specific identifier you already know the name of
discover({ grep: "questModifyBroker" })

// ✅ Narrow a large tree — glob first, grep refines
discover({ glob: "packages/hooks/src/guards/**", grep: "permission" })
\`\`\`

\`\`\`
// ❌ WRONG — grep with long phrases hoping to match file content
discover({ grep: "Code Discovery", glob: "packages/mcp/src/**/*" })
discover({ grep: "discover is the ONLY way", glob: "**/*statics*" })
discover({ grep: "discover is the ONLY way", glob: "**/*.ts" })
// 3 failed calls. The fix: discover({ glob: "packages/shared/src/brokers/architecture/**" })
// One glob → see the tree → find the file → done.

// ❌ WRONG — grep with OR patterns or regex guesses
discover({ glob: "packages/config", grep: "monorepo|root|setup" })
// You don't know what terms exist. Just glob the folder and read the tree.

// ❌ WRONG — combining glob + grep on first search
discover({ glob: "packages/*/src/**", grep: "someFeature" })
// The glob is too wide and the grep is a guess. Glob a specific folder type first.
\`\`\`

**The rule:** If you don't already know the exact function/variable name, use glob alone. The tree output has file purposes — that IS your search. Only add grep when you have a specific identifier to locate across the codebase.

**Always discover before creating.** Check if similar code exists. If it does, extend it — don't duplicate.`;

  // Build frontend data flow rules
  const frontendDataFlow = `**Critical Rules:**

1. **Widgets get data through bindings, never brokers**
   - ✅ Render: Call bindings only
   - ✅ Events: Call brokers only
   - ❌ Never call brokers in render
   - ❌ Never call bindings in events (React error)

2. **Bindings wrap single broker only (no orchestration)**
   - If you \`await\` twice → move to brokers/
   - Bindings return {data, loading, error}

3. **Extend bindings with options, don't create variants**
   - ✅ useUserDataBinding({userId, includeCompany})
   - ❌ useUserWithCompanyBinding

**Example:**
\`\`\`typescript
// ✅ CORRECT - Widget uses binding in render
export const UserCardWidget = ({userId}) => {
  const {data: user, loading, error} = useUserDataBinding({userId});

  // ✅ CORRECT - Broker in event handler
  const handleUpdate = async () => {
    await userUpdateBroker({userId, data: user});
  };

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
};

// ❌ WRONG - Binding in event handler
const handleClick = () => {
  const {data} = useUserDataBinding({userId});  // React error!
};
\`\`\``;

  // Build backend validation rules
  const backendValidation = `**Boundary Validation Rule:**

ALL responder inputs from external sources MUST be validated through contracts:

**External sources:**
- HTTP: req.body, req.params, req.query
- Queues: job.data
- Files: JSON.parse results
- CLI: stdin
- Browser: useParams(), localStorage

**Pattern:**
\`\`\`typescript
export const UserCreateResponder = async ({req, res}: {
  req: Request;
  res: Response;
}): Promise<void> => {
  const body: unknown = req.body;  // Explicit unknown
  const validated = userCreateContract.safeParse(body);
  if (!validated.success) {
    return res.status(400).json({error: validated.error});
  }
  // Use validated.data with type safety
  const user = await userCreateBroker({userData: validated.data});
  res.json(user);
};
\`\`\`

**Responders handle ONLY:**
- Input validation/parsing (contracts)
- Calling brokers
- Output formatting (transformers)
- HTTP status codes

**NO business logic in responders!**`;

  // Build import rules section
  const importRules =
    `**Cross-Folder Import Rules:**

Only **entry files** can be imported across domain folders.

**Entry files** = filename exactly matches folder path + suffix (no extra words)

**Pattern:** \`[folder-path]-[folder-suffix].ts\`

**Examples:**
- \`brokers/user/fetch/user-fetch-broker.ts\` ✅ Entry file (filename = folder path)
- \`adapters/axios/get/axios-get-adapter.ts\` ✅ Entry file (filename = folder path)
- \`contracts/user/user-contract.ts\` ✅ Entry file (filename = folder path)
- \`brokers/user/fetch/validate-helper.ts\` ❌ NOT entry (has extra "validate")
- \`brokers/user/fetch/validate-layer-broker.ts\` ❌ NOT entry (has "validate-layer")
- \`widgets/user-card/avatar-layer-widget.tsx\` ❌ NOT entry (has "avatar-layer")

\`\`\`typescript
// ✅ CORRECT - Importing entry file (name matches folders)
import {userFetchBroker} ` +
    `from '../../brokers/user/fetch/user-fetch-broker';
import {axiosGetAdapter} ` +
    `from '../../../adapters/axios/get/axios-get-adapter';

// ❌ WRONG - Importing non-entry files (names have extra parts)
import {validateHelper} ` +
    `from '../../brokers/user/fetch/validate-helper';
import {validateLayerBroker} ` +
    `from '../../brokers/user/fetch/validate-layer-broker';
import {avatarLayerWidget} ` +
    `from '../user-card/avatar-layer-widget';
\`\`\`

**Same-folder imports:** Files within same domain folder can import each other freely (including helpers and layers).

**Layer files** (\`-layer-\` in filename) are internal implementation details - they can ONLY be imported within their own domain folder, never across domains.`;

  // Build layer files section - dynamically generate allowed folders
  const allowsLayerFolders = folderEntries
    .filter(({ config }) => config.allowsLayerFiles)
    .map(({ key }) => `\`${key}/\``)
    .join(', ');

  const layerFiles =
    `**Purpose:** Decompose complex files (>300 lines) into focused, testable layers while maintaining domain context.

**Naming:** \`{descriptive-name}-layer-{folder-suffix}.{ext}\`

**Allowed in:** ${allowsLayerFolders} only

**Structure:**
\`\`\`
brokers/user/fetch/
  user-fetch-broker.ts              # Parent - orchestrates layers
  user-fetch-broker.proxy.ts
  user-fetch-broker.test.ts

  validate-input-layer-broker.ts    # Layer - validation logic
  validate-input-layer-broker.proxy.ts
  validate-input-layer-broker.test.ts

  format-response-layer-broker.ts   # Layer - formatting logic
  format-response-layer-broker.proxy.ts
  format-response-layer-broker.test.ts
\`\`\`

**Layer files ARE:**
- ✅ Co-located with parent (same directory, flat structure)
- ✅ Full entities with own \`.proxy.ts\` and \`.test.ts\` if complex
- ✅ Independently testable with their own test suite
- ✅ Scoped to parent's domain (not reusable across codebase)
- ✅ Named with \`-layer-\` infix before folder suffix

**Layer files are NOT:**
- ❌ Utilities (those go in \`transformers/\` or \`guards/\`)
- ❌ Reusable across parents (create new domain folder instead)
- ❌ Separate domains (create sibling folder instead)
- ❌ In subfolders (must be flat with parent, no nesting)

**Import rules:**
- ✅ Parent can import layers (same folder)
- ✅ Layers can import other layers (same folder)
- ❌ Cannot import layers from different domain folders
- ❌ Cannot import layers from different actions (even same domain)

**Example:**
\`\`\`typescript
// ✅ CORRECT - Same folder imports
// In: brokers/user/fetch/user-fetch-broker.ts
import {validateInputLayerBroker} ` +
    `from './validate-input-layer-broker';
import {formatResponseLayerBroker} ` +
    `from './format-response-layer-broker';

// ✅ CORRECT - Layer importing layer (same folder)
// In: brokers/user/fetch/validate-input-layer-broker.ts
import {formatResponseLayerBroker} ` +
    `from './format-response-layer-broker';

// ❌ WRONG - Cross-domain layer import
// In: brokers/auth/login/auth-login-broker.ts
import {validateInputLayerBroker} ` +
    `from '../../user/fetch/validate-input-layer-broker';

// ❌ WRONG - Different action layer import (same domain)
// In: brokers/user/update/user-update-broker.ts
import {validateInputLayerBroker} ` +
    `from '../fetch/validate-input-layer-broker';
\`\`\`

**When to create layer:**
- Parent exceeds 300 lines
- Layer calls different dependencies (needs own proxy)
- Layer has distinct responsibility
- Layer needs >10 test cases

**When NOT to create layer:**
- Logic is reusable → extract to \`guards/\` or \`transformers/\`
- Logic is <50 lines → keep inline
- Folder doesn't allow layers (see \`allowsLayerFiles\` in config)

**Testing:**
- Each layer has its own test file following standard proxy pattern
- Create fresh proxy per test
- Tests verify layer's focused responsibility independently

**Lint Enforcement:**
- \`@dungeonmaster/enforce-project-structure\` - validates folder allows layers
- \`@dungeonmaster/enforce-implementation-colocation\` - validates layer has parent in same directory
- File suffix rules - validates \`-layer-\` appears before folder suffix`;

  // Build @types folder section
  const typesFolder = `**Special Case: @types/ Folder**

The \`@types/\` folder is allowed **at package root only** (not in \`src/\`) for global TypeScript type augmentations.

\`\`\`
package-root/
├── @types/
│   └── error-cause.d.ts     # Global type augmentations (extending Error, Window, etc.)
├── src/
│   └── contracts/           # Application contracts (NOT @types or types/)
└── package.json
\`\`\`

**Use for:** Extending built-in JavaScript/TypeScript types (\`Error\`, \`Window\`, etc.)
**Do NOT use for:** Application types (those go in \`src/contracts/\`)`;

  // Build quality commands section
  const qualityCommands = `**ALWAYS use \`npm run ward\` instead of raw tool invocations:**

| ❌ Don't Use | ✅ Use Instead |
|-------------|---------------|
| \`npx jest ...\` | \`npm run ward -- --only test -- <path>\` |
| \`npx jest -t "name"\` | \`npm run ward -- --only unit --onlyTests "name"\` |
| \`npx eslint ...\` | \`npm run ward -- --only lint\` |
| \`npx tsc --noEmit\` | \`npm run ward -- --only typecheck\` |
| \`npm test\` | \`npm run ward -- --only test\` |
| Running all checks | \`npm run ward\` |

### Check Types

| Check Type | Tool | Description |
|------------|------|-------------|
| \`lint\` | ESLint | Linting with \`--fix\` |
| \`typecheck\` | tsc | TypeScript type checking |
| \`unit\` | Jest | Unit tests (\`*.test.ts\`, excludes \`*.integration.test.ts\`) |
| \`integration\` | Jest | Integration tests (\`*.integration.test.ts\` only) |
| \`e2e\` | Playwright | End-to-end browser tests |
| \`test\` | *(alias)* | Expands to \`unit,integration,e2e\` (runs all three) |

**\`test\` is a virtual alias**, not a real check type. \`--only test\` expands to \`--only unit,integration,e2e\` during CLI parsing. Deduplication is automatic: \`--only test,e2e\` becomes \`--only unit,integration,e2e\`.

### Flags

| Flag | Description |
|------|-------------|
| \`--only lint,typecheck,unit,integration,e2e\` | Comma-separated list of check types to run. Omit to run all five. |
| \`--onlyTests <regex>\` | Filter tests by name pattern. Maps to Jest \`--testNamePattern\` and Playwright \`--grep\`. |
| \`--changed\` | Scope checks to files changed in git (uses \`git diff\`). |
| \`-- file1 file2\` | Passthrough file list. Everything after \`--\` is treated as file paths. |
| \`--verbose\` | Enable verbose output. |

**\`--onlyTests\` accepts a regex pattern.** Use \`|\` for alternation: \`--onlyTests "foo|bar"\` runs tests matching either name. Ignored by lint and typecheck check types.

### Common Invocations

\`\`\`bash
npm run ward                                          # All checks, all packages
npm run ward -- --only lint                           # Lint only
npm run ward -- --only test                           # All tests (unit + integration + e2e)
npm run ward -- --only unit                           # Unit tests only
npm run ward -- --only unit -- path/to/file.test.ts   # Single test file
npm run ward -- --only unit --onlyTests "my test"     # Tests by name pattern
npm run ward -- --only unit --onlyTests "foo|bar"     # Tests matching multiple patterns
npm run ward -- -- packages/hooks                     # Scope to single package
npm run ward -- --only lint --changed                 # Lint only changed files
\`\`\`

### Inspecting Failures

When ward finds failures, the run output shows a summary with truncated errors. Use the ward detail subcommand for full details:

1. Run checks: \`npm run ward -- --only lint,test\`
2. Run \`npm run ward -- detail <runId> <filePath>\` to see full error messages and jest diffs

**Zero tolerance for ward failures:** NEVER assume a failure is "pre-existing" or "unrelated" to your changes. Every ward failure must be investigated and fixed before a task is complete. Ward must be fully green. Failures that look unrelated are often caused by transitive effects (stale dist builds, proxy chain breakage, cache invalidation, or side-effect imports exposed by type changes). Always trace the full dependency chain.

### Examples

\`\`\`bash
# File + test name pattern together
npm run ward -- --only unit --onlyTests "validates input" -- packages/hooks/src/brokers/quest/quest-broker.test.ts

# Combo: lint + typecheck + unit on one package
npm run ward -- --only lint,typecheck,unit -- packages/hooks

# Combo: lint + test (all test types) on changed files only
npm run ward -- --only lint,test --changed
\`\`\``;

  // Build critical rules
  const criticalRules = `**Never do these things (❌):**
- ❌ Use while (true) - use recursion instead
- ❌ Import from implementation files across folders - only import entry files
- ❌ Use raw primitives (string, number) - use branded Zod types
- ❌ Create utils/, helpers/, common/, shared/ folders
- ❌ Use console.log() in CLI - use process.stdout.write()
- ❌ Use delete with computed keys - use Reflect.deleteProperty()

**Always do these things (✅):**
- ✅ Use object destructuring for function parameters
- ✅ Explicit return types for all exported functions
- ✅ Co-locate test files with implementation
- ✅ Use async/await over .then() chains
- ✅ File names in kebab-case
- ✅ Metadata comments (PURPOSE/USAGE) at top of implementation files`;

  // Build testing architecture summary
  const testingArchitecture = `**Mock only at I/O boundaries:**
- Adapters mock npm packages (axios, fs)
- Globals mock non-deterministic functions (Date.now)
- Everything else runs REAL (brokers, guards, transformers, widgets)

**Proxy pattern:**
- Tests use \`.proxy.ts\` files for setup
- Create fresh proxy per test
- Proxies provide semantic methods, not raw mocks

**Get full testing guidance:** Use \`get-testing-patterns\` tool for complete philosophy, proxy patterns, and assertion rules.`;

  // Build MCP tools reference
  const mcpToolsReference = `These MCP tools provide detailed guidance beyond this overview. Use them before writing code.

| Tool | Params | Returns | When to Use |
|------|--------|---------|-------------|
| \`discover\` | \`{ glob?, grep? }\` | File list with metadata/purposes | Orientation — find files, get a lay of the land |
| \`discover\` | \`{ ..., verbose: true }\` | Signatures, companions, usage sites | Need detail (signature, typo check) without reading the full file |
| \`Read\` | file path | Full file contents | Need actual code — implementing, editing, understanding logic |
| \`get-architecture\` | *(none)* | This document — folder types, import rules, decision tree | First thing on any task |
| \`get-folder-detail\` | \`{ folderType }\` | Naming, imports, constraints, code examples, proxy requirements | Before creating/modifying files in a folder type |
| \`get-syntax-rules\` | *(none)* | File naming, exports, types, destructuring conventions | Ensuring code passes ESLint |
| \`get-testing-patterns\` | *(none)* | Testing philosophy, proxy patterns, assertion rules, test structure | Before writing tests or proxy files |`;

  // Combine all sections
  const markdown = `# Architecture Overview

## Critical Context: Why This Architecture

${whyThisStructure}

## Code Discovery

${codeDiscovery}

## Folder Types

${folderTypesTable}

## Architecture Layer Diagram

${layerDiagram}

## Decision Tree: Where Does Code Go?

${decisionTree}

## Forbidden Folders - Where Code Actually Goes

${forbiddenFolders}

${typesFolder}

## Import Rules

${importRules}

## Layer Files - Decomposing Complex Components

${layerFiles}

## Extension Over Creation Philosophy

${extensionRules}

## Frontend Data Flow (React)

${frontendDataFlow}

## Backend Validation (Express/HTTP)

${backendValidation}

## Quality Commands

${qualityCommands}

## Critical Rules Summary

${criticalRules}

### Testing Architecture

${testingArchitecture}

## MCP Tools Reference

${mcpToolsReference}

Use MCP tools (get-folder-detail, get-syntax-rules, get-testing-patterns) for detailed patterns.
`;

  return contentTextContract.parse(markdown);
};
