# questmaestro/eslint-plugin

This a plugin lib that gets published as an npm package that other projects can bring in to get predefined rulesets that
constrain LLM coding and make sure it outputs good code. The configurations in here are also used in this repo to
utilize the same advantages.

## Adding New Rules

When creating a new ESLint rule, you MUST update these files:

1. **Create rule broker**: `src/brokers/rule/{rule-name}/{rule-name}-rule-broker.ts`
2. **Create rule tests**: `src/brokers/rule/{rule-name}/{rule-name}-rule-broker.test.ts`
3. **Register rule**: `src/startup/start-eslint-plugin.ts`
    - Import the rule broker
    - Add to the `rules` type definition
    - Add to the `rules` object
   - Fix test
4. **Add to config**: `src/brokers/config/questmaestro/config-questmaestro-broker.ts`
    - Add to `questmaestroCustomRules` object with `'error'` level

Missing any of these steps will result in the rule not being available or enforced. Make sure you run tests for each
file you modified above and correct any issues.

## Testing

- **Rule brokers** (`src/brokers/rule/**`) - Tested with ESLint's RuleTester integration tests, not traditional Jest
  unit tests. Tests are co-located (e.g., `rule-explicit-return-types-broker.test.ts`).
- `test/helpers/eslintRuleTester.ts` - Creates configured RuleTester with TypeScript parser for rule integration
  tests. Uses `require('@typescript-eslint/parser')` at runtime due to module resolution constraints - top-level import
  fails with `moduleResolution: "node"`.

## Type Handling for ESLint Rules

When implementing custom ESLint rules, there's a type mismatch between ESLint's `NodeListener` return type and the
TypeScript AST types from `@typescript-eslint/utils`. To avoid unsafe type assertions:

### Pattern 1: Use Minimal Structural Interfaces

Instead of asserting to specific TSESTree types, define minimal interfaces that describe only the properties you need:

```typescript
// ❌ Avoid: Unsafe type assertion
ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
    // This causes type errors because ESLint's node type doesn't match TSESTree exactly
}

// ✅ Good: Minimal interface with type guard
interface NodeWithExportKind {
    exportKind?: 'type' | 'value';
    declaration?: TSESTree.Node | null;
}

const hasExportKind = (nodeToCheck: unknown): nodeToCheck is NodeWithExportKind =>
    typeof nodeToCheck === 'object' && nodeToCheck !== null && 'exportKind' in nodeToCheck;

ExportNamedDeclaration: (node): void => {
    if (!hasExportKind(node)) return;
    // Now you can safely access node.exportKind and node.declaration
}
```

### Pattern 2: Omit Type Annotations on Listener Parameters

Let TypeScript infer the type from ESLint's NodeListener, then use structural checks:

```typescript
// ❌ Avoid: Explicit TSESTree types
ArrowFunctionExpression: (node: TSESTree.ArrowFunctionExpression): void => {
}

// ✅ Good: Inferred type with structural interface
interface FunctionLike {
    params: { type: string }[];
}

ArrowFunctionExpression: (node): void => {
    const funcNode = node as FunctionLike;
    // Use funcNode.params
}
```

### Pattern 3: Handle Readonly Arrays from `as const`

When working with `as const` objects, arrays are readonly and cannot be assigned to mutable types:

```typescript
// ❌ Avoid: Direct assignment fails
const config: { fileSuffix: string | string[] } = folderConfigStatics[key];
// Error: readonly string[] not assignable to string[]

// ✅ Good: Accept readonly arrays in interface
interface FolderConfig {
    fileSuffix: string | readonly string[];
}

// When you need a string, use type narrowing:
const suffix: string = Array.isArray(fileSuffix)
    ? fileSuffix.join(' or ')
    : String(fileSuffix);
```

### Why These Patterns Work

ESLint's `NodeListener` uses its own node type system that has slight differences from `@typescript-eslint/utils`'s
TSESTree types, even though they represent the same AST nodes at runtime. By using structural typing and minimal
interfaces, we stay compatible with both type systems without unsafe assertions.

## File Type Detection in Rules

When implementing rules that need to check file types, folder types, or file patterns, use the existing guards in
`src/guards/`:

### `isFileInFolderTypeGuard`

**Location:** `src/guards/is-file-in-folder-type/is-file-in-folder-type-guard.ts`

**Purpose:** Check if a file is in a specific folder type with the expected suffix.

**Pattern:**

```typescript
import {isFileInFolderTypeGuard} from '../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';

// Check if file is a broker
if (isFileInFolderTypeGuard({filename, folderType: 'brokers', suffix: 'broker'})) {
    // File is in brokers/ folder and ends with -broker.ts or -broker.tsx
}

// Check if file is a widget
if (isFileInFolderTypeGuard({filename, folderType: 'widgets', suffix: 'widget'})) {
    // File is in widgets/ folder and ends with -widget.ts or -widget.tsx
}

// Check if file is a contract
if (isFileInFolderTypeGuard({filename, folderType: 'contracts', suffix: 'contract'})) {
    // File is in contracts/ folder and ends with -contract.ts
}
```

**Features:**

- Automatically adds dash prefix to suffix (`suffix: 'broker'` checks for `-broker`)
- Checks both `.ts` and `.tsx` extensions
- Validates file is in the correct folder type (`/{folderType}/` in path)
- Returns `false` if any parameter is missing

### Layer File Detection

**Pattern for layer files** (files with `-layer-` infix):

```typescript
// Check if filename contains -layer- before the suffix
const isLayerFile = filename.includes('-layer-');

// Validate layer file is in allowed folder type
const folderType = projectFolderTypeFromFilePathTransformer({filename});
const folderConfig = folderConfigStatics[folderType];

if (isLayerFile && !folderConfig?.allowsLayerFiles) {
    // Report error: layer files not allowed in this folder type
}

// Layer file naming: {descriptive-name}-layer-{folder-suffix}.ts
// Examples:
//   validate-folder-depth-layer-broker.ts
//   avatar-layer-widget.tsx
//   validate-request-layer-responder.ts
```

**Layer files are allowed in:**

- `brokers/` - Complex business logic decomposition
- `widgets/` - Complex UI sub-components
- `responders/` - Complex request handling layers

See `src/statics/folder-config/folder-config-statics.ts` for `allowsLayerFiles` configuration per folder type.