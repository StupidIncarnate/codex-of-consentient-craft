import { ruleEnforceStubUsageBroker } from './rule-enforce-stub-usage-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-stub-usage', ruleEnforceStubUsageBroker(), {
  valid: [
    // ✅ No type annotation - allowed
    {
      code: `
        it('test', () => {
          const functionNode = {
            type: 'ArrowFunctionExpression',
            body: [],
          };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // ✅ Type annotation but using stub - allowed
    {
      code: `
        it('test', () => {
          const functionNode: Tsestree = TsestreeStub({
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

    // ✅ Inferred types - allowed
    {
      code: `
        it('test', () => {
          const data = { type: 'test', value: 123 };
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },
  ],

  invalid: [
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

    // ❌ Empty object with type
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
  ],
});
