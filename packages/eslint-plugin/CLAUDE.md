# questmaestro/eslint-plugin

This a plugin lib that gets published as an npm package that other projects can bring in to get predefined rulesets that
constrain LLM coding and make sure it outputs good code. The configurations in here are also used in this repo to
utilize the same advantages.

## Testing

- **Rule brokers** (`src/brokers/rule/**`) - Tested with ESLint's RuleTester integration tests, not traditional Jest
  unit tests. Tests are co-located (e.g., `explicit-return-types-rule-broker.test.ts`).
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