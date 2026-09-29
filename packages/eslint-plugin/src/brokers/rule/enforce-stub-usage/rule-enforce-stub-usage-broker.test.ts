import { ruleEnforceStubUsageBroker } from './rule-enforce-stub-usage-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

ruleTester.run('enforce-stub-usage', ruleEnforceStubUsageBroker(), {
  valid: [
    // ✅ Outside type from its gateway stub - nothing to cast
    {
      code: `
        import { ChildProcessStub } from '#gateway/node/child_process/child-process/child-process.stub';
        const child = ChildProcessStub();
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },

    // ✅ Cast to never is not a cast to an outside type
    {
      code: `
        import type { TSESLint } from '@typescript-eslint/utils';
        const c = { report: jest.fn() } as never;
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },

    // ✅ Cast to a locally declared type
    {
      code: `
        type Local = { a: number };
        const c = { a: 1 } as Local;
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },

    // ✅ Outside cast in a production file - rule does not apply
    {
      code: `
        import type { TSESTree } from '@typescript-eslint/utils';
        const node = { type: 'CallExpression' } as TSESTree.CallExpression;
      `,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // ✅ Option off - the cast check does not run
    {
      code: `
        import type { TSESTree } from '@typescript-eslint/utils';
        const node = { type: 'CallExpression' } as TSESTree.CallExpression;
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      options: [{ outsideTypeCasts: false }],
    },

    // ✅ Using stub function - allowed
    {
      code: `
        it('test', () => {
          const functionNode = TsestreeStub({
            type: 'ArrowFunctionExpression',
            body: [],
          });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Non-test file - rule doesn't apply
    {
      code: `
        const functionNode: Tsestree = {
          type: 'ArrowFunctionExpression',
          body: [],
        };
      `,
      filename: '/project/src/brokers/user/user-broker.ts',
    },

    // ✅ Gateway test file - inline object literal is the only option (no contract, no stub)
    {
      code: `
        it('test', () => {
          const entry: DirEntrySync = { name: 'a.txt', isDirectory: false };
        });
      `,
      filename: '/repo/packages/@gateway/node/src/fs/readdir-entries-sync.test.ts',
    },

    // ✅ Primitive type annotations - allowed
    {
      code: `
        it('test', () => {
          const count: number = 5;
          const name: string = 'test';
          const flag: boolean = true;
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Type annotation but non-object/array init - allowed
    {
      code: `
        it('test', () => {
          const value: User = getUser();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Empty array with type - allowed (nothing to stub)
    {
      code: `
        it('test', () => {
          const items: User[] = [];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Empty array with ReturnType - allowed
    {
      code: `
        it('test', () => {
          const overrides: ReturnType<typeof ConfigStub>[] = [];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Array of primitives - allowed
    {
      code: `
        it('test', () => {
          const ids = ['1', '2', '3'];
          const counts = [1, 2, 3];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Array of stubs - allowed
    {
      code: `
        it('test', () => {
          const users = [UserStub({ id: '1' }), UserStub({ id: '2' })];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Array of function calls - allowed
    {
      code: `
        it('test', () => {
          const items = [getUser(), getUser()];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Clone built only from a stub spread - allowed (reaches shapes a stub cannot return)
    {
      code: `
        it('test', () => {
          const facts = { ...WalkFactsStub() };
        });
      `,
      filename: '/project/src/contracts/walk-facts/walk-facts-contract.test.ts',
    },

    // ✅ Clone merging two stub spreads - allowed
    {
      code: `
        it('test', () => {
          const merged = { ...UserStub(), ...AddressStub({ city: 'Springfield' }) };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
    // ❌ Outside type cast in a proxy
    {
      code: `
        import type { TSESTree } from '@typescript-eslint/utils';
        const node = { type: 'CallExpression' } as TSESTree.CallExpression;
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'outsideTypeCast', data: { typeName: 'TSESTree' } }],
    },

    // ❌ Outside type cast through unknown in a stub
    {
      code: `
        import type * as ts from 'typescript';
        const sourceFile = { fileName: 'x.ts' } as unknown as ts.SourceFile;
      `,
      filename: '/project/src/contracts/user/user.stub.ts',
      errors: [{ messageId: 'outsideTypeCast', data: { typeName: 'ts' } }],
    },

    // ❌ Outside type cast through Partial in a test
    {
      code: `
        import type { TSESLint } from '@typescript-eslint/utils';
        const context = { report: jest.fn() } as Partial<TSESLint.RuleContext<string, []>>;
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        { messageId: 'useStubInsteadOfTypedLiteral', data: { typeName: 'Object' } },
        { messageId: 'outsideTypeCast', data: { typeName: 'TSESLint' } },
      ],
    },

    // ❌ Outside type cast in a harness
    {
      code: `
        import type { ChildProcess } from 'child_process';
        const child = { pid: 1 } as ChildProcess;
      `,
      filename: '/project/test/harnesses/child/child.harness.ts',
      errors: [{ messageId: 'outsideTypeCast', data: { typeName: 'ChildProcess' } }],
    },

    // ❌ Same cast in a gateway proxy - the gateway is not exempt
    {
      code: `
        import type { ChildProcess } from 'child_process';
        const child = { pid: 1 } as ChildProcess;
      `,
      filename: '/repo/packages/@gateway/node/src/child_process/stream/stream.proxy.ts',
      errors: [{ messageId: 'outsideTypeCast', data: { typeName: 'ChildProcess' } }],
    },

    // ❌ Typed object literal in test
    {
      code: `
        it('test', () => {
          const functionNode: Tsestree = {
            type: 'ArrowFunctionExpression',
            body: [],
          };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Tsestree' },
        },
      ],
    },

    // ❌ Typed array literal in test
    {
      code: `
        it('test', () => {
          const items: User[] = [
            { id: '1', name: 'John' },
            { id: '2', name: 'Jane' }
          ];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'User' },
        },
      ],
    },

    // ❌ Generic Array<T> syntax
    {
      code: `
        it('test', () => {
          const items: Array<User> = [
            { id: '1', name: 'John' }
          ];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Array' },
        },
      ],
    },

    // ❌ Complex type annotation
    {
      code: `
        it('test', () => {
          const config: EslintContext = {
            report: jest.fn(),
            getFilename: () => '/test/file.ts'
          };
        });
      `,
      filename: '/project/src/brokers/rule/my-rule-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'EslintContext' },
        },
      ],
    },

    // ❌ Empty object with type annotation
    {
      code: `
        it('test', () => {
          const user: User = {};
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'User' },
        },
      ],
    },

    // ❌ Empty object WITHOUT type annotation (inferred)
    {
      code: `
        it('test', () => {
          const data = {};
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
      ],
    },

    // ❌ Array with empty object inside
    {
      code: `
        it('test', () => {
          const items = [{}];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Array' },
        },
      ],
    },

    // ❌ Multiple violations in same test
    {
      code: `
        it('test', () => {
          const node1: Tsestree = { type: 'Identifier' };
          const node2: Tsestree = { type: 'CallExpression' };
        });
      `,
      filename: '/project/src/brokers/rule/my-rule-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Tsestree' },
        },
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Tsestree' },
        },
      ],
    },

    // ❌ Inline object literal with type annotation
    {
      code: `
        it('test', () => {
          const data: ViolationData = { functionName: 'testFunc', issue: 'no params' };
        });
      `,
      filename: '/project/src/transformers/ast-to-violation/ast-to-violation-transformer.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'ViolationData' },
        },
      ],
    },

    // ❌ Inline object literal WITHOUT type annotation (inferred)
    {
      code: `
        it('test', () => {
          const data = { functionName: 'testFunc', issue: 'no params' };
        });
      `,
      filename: '/project/src/transformers/ast-to-violation/ast-to-violation-transformer.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
      ],
    },

    // ❌ Inline array literal WITHOUT type annotation (inferred)
    {
      code: `
        it('test', () => {
          const items = [{ id: '1' }, { id: '2' }];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Array' },
        },
      ],
    },

    // ❌ Nested object literal with type annotation
    {
      code: `
        it('test', () => {
          const config: Config = {
            database: { host: 'localhost', port: 5432 },
            cache: { ttl: 3600 }
          };
        });
      `,
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Config' },
        },
      ],
    },

    // ❌ Object with spread - both baseUser and user are violations
    {
      code: `
        it('test', () => {
          const baseUser = { id: '1' };
          const user: User = { ...baseUser, name: 'John' };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'User' },
        },
      ],
    },

    // ❌ Stub spread mixed with a hand-written property - still a hand-built literal
    {
      code: `
        it('test', () => {
          const user: User = { ...UserStub(), name: 'John' };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'User' },
        },
      ],
    },

    // ❌ Spread of a non-stub call
    {
      code: `
        it('test', () => {
          const user = { ...buildUser() };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
      ],
    },

    // ❌ Array with single element
    {
      code: `
        it('test', () => {
          const items: User[] = [{ id: '1', name: 'John' }];
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'User' },
        },
      ],
    },

    // ❌ Outside of it() but inside describe() in test file
    {
      code: `
        describe('test suite', () => {
          const mockData: TestData = { value: 'test', count: 5 };

          it('test', () => {
            expect(mockData).toBeDefined();
          });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'TestData' },
        },
      ],
    },

    // ❌ Type assertion with as (e.g., {} as Type)
    {
      code: `
        it('test', () => {
          const functionNode = {
            type: 'ArrowFunctionExpression',
            parent: null,
          } as unknown as Tsestree;
        });
      `,
      filename: '/project/src/brokers/rule/my-rule-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
      ],
    },

    // ❌ Type assertion with complex nested object
    {
      code: `
        it('test', () => {
          const node = {
            type: TsestreeNodeType.BlockStatement,
            body: [
              {
                type: TsestreeNodeType.ReturnStatement,
                argument: null,
              },
            ],
          } as ReturnType<typeof TsestreeStub>;
        });
      `,
      filename: '/project/src/brokers/rule/my-rule-broker.test.ts',
      errors: [
        {
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: 'Object' },
        },
      ],
    },
  ],
});
