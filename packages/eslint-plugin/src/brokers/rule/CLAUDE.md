# Rule Brokers Testing

**IMPORTANT:** Rule brokers use ESLint's RuleTester integration tests, NOT standard Jest unit tests.

## TypeScript AST Type Handling

**CRITICAL:** Do NOT create ad-hoc interfaces for AST node types, and do NOT write a local copy of a library type.
Import `TSESTree` and `TSESLint` from `#gateway/npm/typescript-eslint__utils`.

### Why

ESLint rules walk the AST that `@typescript-eslint/parser` produces. `TSESTree` is a discriminated union of every node
type, so checking `node.type === AST_NODE_TYPES.CallExpression` narrows the node and its fields are read directly.
The `@dungeonmaster/ban-adhoc-types` rule enforces this - ad-hoc interfaces in rule brokers fail lint.

### When Writing Rules

```typescript
// ❌ FORBIDDEN - Will fail @dungeonmaster/ban-adhoc-types
interface NodeWithCallee {
  callee?: { type?: string };
}
const calleeNode = node as NodeWithCallee;

// ✅ CORRECT - the library's own types, through the gateway
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleMyBroker = (): TSESLint.RuleModule<'myMessageId'> => ({
  meta: { type: 'problem', docs: { description: '...' }, messages: { myMessageId: '...' }, schema: [] },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => ({
    CallExpression: (node: TSESTree.CallExpression): void => {
      const { callee } = node;  // never undefined on the real type
      if (callee.type === AST_NODE_TYPES.MemberExpression) {
        // callee.object and callee.property are available here
      }
    },
  }),
});
```

### When A Type Is Missing

If you need a node type or field, it is already on `TSESTree`. Narrow to it with `AST_NODE_TYPES`, or import the
type by name. Nothing is added to a contract, because no contract holds an AST node.

## Structure

```typescript
import {ruleTesterHarness} from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import {myRuleBroker} from './my-rule-broker';

const ruleTester = ruleTesterHarness();

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
- **Mock at adapter level** - Use `registerMock` from `@dungeonmaster/testing/register-mock` to mock adapters

## When to Mock

Mock file system checks and external dependencies that rules need for validation logic:

```typescript
import {fsExistsSyncAdapter} from '../../../adapters/fs/fs-exists-sync';
import {registerMock} from '@dungeonmaster/testing/register-mock';

const mockFsExistsSync = registerMock({fn: fsExistsSyncAdapter});

beforeEach(() => {
    // No single path to key on: RuleTester's valid/invalid cases pass many different
    // filenames, so [] is the honest catch-all and the predicate itself discriminates.
    mockFsExistsSync.calledWith([]).implement(({filePath}) => {
        const existingFiles = ['/project/src/user.ts'];
        return existingFiles.includes(String(filePath));
    });
});
```

See testing standards for unit test patterns - those apply to all other code except rule brokers.

## Layer Broker Tests

**Layer brokers in rule folders use standard Jest `describe/it` tests, NOT RuleTester.** They are pure functions that
take AST nodes + context and call `context.report()`. Test them directly.

The eslint config enforces this: layer test files (`*-layer-*.test.ts`) are excluded from the RuleTester exemptions and
must follow standard broker test conventions (proxies, describe/it blocks).

```typescript
import {validateFolderLocationLayerBroker} from './validate-folder-location-layer-broker';
import {validateFolderLocationLayerBrokerProxy} from './validate-folder-location-layer-broker.proxy';
import {RuleContextStub} from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import {ProgramStub} from '#gateway/npm/typescript-eslint__utils/program/program.stub';

describe('validateFolderLocationLayerBroker', () => {
    describe('forbidden folder', () => {
        it('reports forbiddenFolder for utils/', () => {
            validateFolderLocationLayerBrokerProxy();
            const mockReport = jest.fn();
            const context = RuleContextStub({report: mockReport});
            const node = ProgramStub({code: ''});

            validateFolderLocationLayerBroker({node, context, firstFolder: 'utils', ...});

            expect(mockReport).toHaveBeenCalledWith(
                expect.objectContaining({messageId: 'forbiddenFolder'}),
            );
        });
    });
});
```

**Key points:**

- Call the layer proxy at the start of each test
- Use `RuleContextStub` with a `jest.fn()` report
- Build AST nodes with the gateway node stubs, one per node type, each taking `{ code }` (`ProgramStub`,
  `CallExpressionStub`, `IdentifierStub`, ...), imported from `#gateway/npm/typescript-eslint__utils/<kebab-node>/<kebab-node>.stub`
- Assert on `context.report()` calls
- Only the **parent** rule broker test uses RuleTester
