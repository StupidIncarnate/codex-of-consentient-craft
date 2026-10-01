# dungeonmaster/eslint-plugin

This a plugin lib that gets published as an npm package that other projects can bring in to get predefined rulesets that
constrain LLM coding and make sure it outputs good code. The configurations in here are also used in this repo to
utilize the same advantages.

## CRITICAL

- **DO NOT CHANGE rootDir in tsConfig:** It WILL break the hook.
- **ESLint and /tmp:** Type-aware ESLint rules (using `project: './tsconfig.json'`) cannot lint files in `/tmp` because
  they're outside the TypeScript project. However, **RuleTester tests work fine anywhere** (they use synthetic code
  strings, not real files). For integration tests that run actual ESLint on real files, keep them in the repo.

## Adding New Rules

When creating a new ESLint rule, you MUST update these files:

1. **Create rule broker**: `src/brokers/rule/{rule-name}/{rule-name}-rule-broker.ts`
2. **Create rule tests**: `src/brokers/rule/{rule-name}/{rule-name}-rule-broker.test.ts`
3. **Register rule**: `src/responders/eslint-plugin/create/eslint-plugin-create-responder.ts`
    - Import the rule broker
    - Add to the `rules` type definition
    - Add to the `rules` object
   - Fix test
4. **Add to config**: `src/brokers/config/dungeonmaster/config-dungeonmaster-broker.ts`
    - Add to `dungeonmasterCustomRules` object with `'error'` level
5. **Categorize for hook enforcement**:
   `src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.ts`
    - Add rule with `'pre-edit'` timing (if rule only checks AST/syntax, no file system operations)
    - Add rule with `'post-edit'` timing (if rule uses gateway fs wrappers like `#gateway/node/fs`,
      e.g. `existsSync`, `readFileSync`, or other fs operations)
   - Update test `src/statics/dungeonmaster-rule-enforce-on/dungeonmaster-rule-enforce-on-statics.test.ts`
   - **CRITICAL**: The integration test `src/dungeonmaster-rule-enforce-on.integration.test.ts` will FAIL if you
      skip this step

Missing any of these steps will result in the rule not being available or enforced. Make sure you run tests for each
file you modified above and correct any issues.

### Pre-Edit vs Post-Edit Rules

**Pre-edit rules** run before files are written to disk (enforced by Claude Code hooks):

- Only analyze AST/syntax
- Check import statements, function signatures, type annotations
- No file system access required
- Examples: `ban-primitives`, `explicit-return-types`, `forbid-non-exported-functions`

**Post-edit rules** run after files are written to disk (normal ESLint):

- Check file existence, colocation patterns
- Use gateway fs wrappers (`existsSync`, `readFileSync`) or other file system operations
- Require files to exist on disk for validation
- Examples: `enforce-proxy-patterns`, `enforce-test-colocation`, `enforce-implementation-colocation`

The integration test suite validates your categorization by scanning rule implementation files for file system
operations.

## Testing

- **Rule brokers** (`src/brokers/rule/**`) - Tested with ESLint's RuleTester integration tests, not traditional Jest
  unit tests. Tests are co-located (e.g., `rule-explicit-return-types-broker.test.ts`).
- `ruleTesterHarness` (`test/harnesses/rule-tester/rule-tester.harness.ts`) - Composes `RuleTester` from `#gateway/npm/eslint` with the TypeScript parser for rule integration tests. `local-eslint` imports it from `@dungeonmaster/eslint-plugin/rule-tester.harness`, a source-only export.
- `typedRuleTesterHarness` (`test/harnesses/typed-rule-tester/typed-rule-tester.harness.ts`) - The same, with `parserOptions.project: true` and the repo root as `tsconfigRootDir`, for the rules that read the type checker. Its cases need a REAL `filename` under a real `tsconfig.json`.

## Type Handling for ESLint Rules

A rule types its nodes and its context with the library's own types. They come from the gateway, never from a local
copy:

```typescript
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanJestMockInTestsBroker = (): TSESLint.RuleModule<
  'noMockingInTests' | 'noCleanupFunctions'
> => ({
  meta: { type: 'problem', docs: { description: '...' }, messages: { /* ... */ }, schema: [] },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => ({
    CallExpression: (node: TSESTree.CallExpression): void => {
      const { callee } = node;
      if (callee.type === AST_NODE_TYPES.MemberExpression) {
        // callee is narrowed to TSESTree.MemberExpression: callee.object and callee.property are always there
      }
    },
  }),
});
```

### Pattern 1: Type Listener Parameters With `TSESTree`

- A listener's parameter is the `TSESTree` node its selector names: `(node: TSESTree.CallExpression)`.
- A `node.type === AST_NODE_TYPES.X` check narrows the union, so the fields of that node are read directly. A
  field the real type marks optional or nullable is guarded; a field it marks required is not.
- Never write a local `interface` or `as { ... }` shape for a node, and never write a local copy of `TSESTree`,
  `TSESLint.RuleContext` or `AST_NODE_TYPES`. When a type is missing from a rule, import the library's own type
  through `#gateway/npm/typescript-eslint__utils`.
- A rule broker returns `TSESLint.RuleModule<MessageIds>` (its message ids as a string-literal union) and carries
  `defaultOptions`.

### Pattern 2: Build Test Nodes And Contexts With The Gateway Stubs

A guard, transformer or layer broker test builds its input from real parsed code, one stub per node type, each
taking `{ code }`, imported from its own file:

```typescript
import { CallExpressionStub } from '#gateway/npm/typescript-eslint__utils/call-expression/call-expression.stub';
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';

const node = CallExpressionStub({ code: "describe.each(table)('name', fn);" });
const context = RuleContextStub({ filename: 'x.ts', report: jest.fn() });
```

The stub folder is the node's kebab-case name (`program/program.stub`, `identifier/identifier.stub`,
`member-expression/member-expression.stub`). A hand-built node object cast to `TSESTree.Node` is never the answer.

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
