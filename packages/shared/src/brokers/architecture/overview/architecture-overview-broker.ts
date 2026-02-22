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

**Search first using the discover endpoint:**
\`\`\`bash
curl -s http://localhost:4737/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","fileType":"broker","search":"user"}'
curl -s http://localhost:4737/api/discover -X POST -H 'Content-Type: application/json' -d '{"type":"files","path":"packages/*/src/bindings"}'
\`\`\`

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
  const qualityCommands = `**ALWAYS use \`dungeonmaster-ward\` instead of raw tool invocations:**

| ❌ Don't Use | ✅ Use Instead |
|-------------|---------------|
| \`npx jest ...\` | \`npx dungeonmaster-ward run --only test -- <path>\` |
| \`npx eslint ...\` | \`npx dungeonmaster-ward run --only lint\` |
| \`npx tsc --noEmit\` | \`npx dungeonmaster-ward run --only typecheck\` |
| \`npm test\` | \`npx dungeonmaster-ward run --only test\` |
| Running all checks | \`npx dungeonmaster-ward run\` |`;

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

  // Combine all sections
  const markdown = `# Architecture Overview

## Critical Context: Why This Architecture

${whyThisStructure}

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
`;

  return contentTextContract.parse(markdown);
};
