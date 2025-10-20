# Rule Brokers Testing

**IMPORTANT:** Rule brokers use ESLint's RuleTester integration tests, NOT standard Jest unit tests.

## TypeScript AST Type Handling

**CRITICAL:** Do NOT create ad-hoc interfaces for AST node types. Use the shared `Tsestree` contract.

### Why

ESLint rules parse TypeScript AST nodes. All node types and their properties are defined in:

```
src/contracts/tsestree/tsestree-contract.ts
```

This contract provides a recursive Zod schema covering all AST node properties (type, callee, object, property, name,
params, body, etc.). The `@questmaestro/ban-adhoc-types` rule enforces this - ad-hoc interfaces in rule brokers will
fail lint.

### When Writing Rules

```typescript
// ❌ FORBIDDEN - Will fail @questmaestro/ban-adhoc-types
interface NodeWithCallee {
  callee?: { type?: string };
}
const calleeNode = node as NodeWithCallee;

// ✅ CORRECT - Use Tsestree contract
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

CallExpression: (node: Tsestree): void => {
  const { callee } = node;  // All properties available via Tsestree
  if (callee?.type === 'MemberExpression') {
    // Access callee.object, callee.property, etc.
  }
}
```

### When to Extend Tsestree Contract

If you need an AST property not in the contract:

1. Open `src/contracts/tsestree/tsestree-contract.ts`
2. Add property to `RecursiveNodeOutput` interface
3. Add property to `RecursiveNodeInput` interface
4. Add property to `recursiveBase` Zod schema
5. Add property to root `tsestreeContract` Zod schema

**Property type patterns:**

- Single node: `property?: RecursiveNodeOutput | null | undefined`
- Array of nodes: `properties?: RecursiveNodeOutput[] | undefined`
- Union: `body?: RecursiveNodeOutput | RecursiveNodeOutput[] | null | undefined`
- Primitive: `name?: string | undefined`, `value?: unknown`

All AST nodes in rule brokers must use `Tsestree` type. Never cast to inline structural types.

## Structure

```typescript
import {eslintRuleTesterAdapter} from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import {myRuleBroker} from './my-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('rule-name', myRuleBroker(), {
    valid: [
        {code: '...', filename: '...'}
    ],
    invalid: [
        {code: '...', filename: '...', errors: [{messageId: '...'}]}
    ],
});
```

## Key Differences from Standard Tests

- **No describe/it blocks** - Use `ruleTester.run()` with `valid` and `invalid` arrays
- **Integration tests** - ESLint parses real code and validates AST selectors
- **Mocking adapters** - Mock underlying adapters (e.g., `fsExistsSyncAdapter`) using `beforeEach()`
- **Mock at adapter level** - Use `jest.mock('../../../adapters/...')`, not npm packages directly

## When to Mock

Mock file system checks and external dependencies that rules need for validation logic:

```typescript
import {fsExistsSyncAdapter} from '../../../adapters/fs/fs-exists-sync';

jest.mock('../../../adapters/fs/fs-exists-sync');

const mockFsExistsSync = jest.mocked(fsExistsSyncAdapter);

beforeEach(() => {
    mockFsExistsSync.mockImplementation(({filePath}) => {
        const existingFiles = ['/project/src/user.ts'];
        return existingFiles.includes(String(filePath));
    });
});
```

See testing standards for unit test patterns - those apply to all other code except rule brokers.
