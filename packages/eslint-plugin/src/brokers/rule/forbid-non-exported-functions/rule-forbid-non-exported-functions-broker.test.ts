import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleForbidNonExportedFunctionsBroker } from './rule-forbid-non-exported-functions-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('forbid-non-exported-functions', ruleForbidNonExportedFunctionsBroker(), {
  valid: [
    // Exported arrow functions are allowed
    {
      code: 'export const myFunction = (): string => "hello"',
      filename: '/project/src/transformers/my-function/my-function-transformer.ts',
    },
    {
      code: 'export const isValid = (): boolean => true',
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },

    // Exported function declarations are allowed
    {
      code: 'export function myFunction(): string { return "hello"; }',
      filename: '/project/src/transformers/my-function/my-function-transformer.ts',
    },

    // Test files are excluded (has multiple dots)
    {
      code: 'const ruleTester = createEslintRuleTester()',
      filename: '/project/src/brokers/rule/my-rule/my-rule-broker.test.ts',
    },
    {
      code: 'const mockFn = jest.fn()',
      filename: '/project/src/adapters/fs/fs-adapter.test.ts',
    },

    // Stub files are excluded (has multiple dots)
    {
      code: 'const UserStub = (props = {}) => ({ ...props })',
      filename: '/project/src/contracts/user/user.stub.ts',
    },

    // Files outside /src/ are excluded
    {
      code: 'const helper = () => "test"',
      filename: '/project/scripts/build.ts',
    },

    // Files directly in /src/ are excluded
    {
      code: 'const helper = () => "test"',
      filename: '/project/src/index.ts',
    },
  ],

  invalid: [
    // Non-exported arrow function with boolean return (suggests guards/)
    {
      code: 'const isValid = (): boolean => true',
      filename: '/project/src/transformers/my-transformer/my-transformer-transformer.ts',
      errors: [{ messageId: 'nonExportedFunction' }],
    },

    // Non-exported arrow function with non-boolean return (suggests transformers/)
    {
      code: 'const formatName = (): string => "John"',
      filename: '/project/src/guards/my-guard/my-guard-guard.ts',
      errors: [{ messageId: 'nonExportedFunction' }],
    },

    // Non-exported arrow function without return type (generic suggestion)
    {
      code: 'const helper = () => "test"',
      filename: '/project/src/brokers/my-broker/my-broker-broker.ts',
      errors: [{ messageId: 'nonExportedFunction' }],
    },

    // Non-exported function declaration
    {
      code: 'function helper() { return "test"; }',
      filename: '/project/src/transformers/my-transformer/my-transformer-transformer.ts',
      errors: [{ messageId: 'nonExportedFunction' }],
    },

    // Nested arrow function inside arrow function
    {
      code: `
        export const outer = (): void => {
          const inner = (): string => "nested";
        }
      `,
      filename: '/project/src/transformers/my-transformer/my-transformer-transformer.ts',
      errors: [{ messageId: 'nestedFunction' }],
    },

    // Nested arrow function inside function declaration
    {
      code: `
        export function outer(): void {
          const inner = (): string => "nested";
        }
      `,
      filename: '/project/src/brokers/my-broker/my-broker-broker.ts',
      errors: [{ messageId: 'nestedFunction' }],
    },

    // Nested function declaration inside arrow function
    {
      code: `
        export const outer = (): void => {
          function inner(): string {
            return "nested";
          }
        }
      `,
      filename: '/project/src/transformers/my-transformer/my-transformer-transformer.ts',
      errors: [{ messageId: 'nestedFunction' }],
    },

    // Nested function expression
    {
      code: `
        export const outer = (): void => {
          const inner = function(): string {
            return "nested";
          };
        }
      `,
      filename: '/project/src/guards/my-guard/my-guard-guard.ts',
      errors: [{ messageId: 'nestedFunction' }],
    },

    // Multiple violations - non-exported and nested
    {
      code: `
        const helper = (): string => "test";

        export const main = (): void => {
          const nested = (): boolean => true;
        }
      `,
      filename: '/project/src/brokers/my-broker/my-broker-broker.ts',
      errors: [{ messageId: 'nonExportedFunction' }, { messageId: 'nestedFunction' }],
    },

    // Deeply nested function
    {
      code: `
        export const outer = (): void => {
          const middle = (): void => {
            const inner = (): string => "deeply nested";
          };
        }
      `,
      filename: '/project/src/transformers/my-transformer/my-transformer-transformer.ts',
      errors: [
        { messageId: 'nestedFunction' }, // middle
        { messageId: 'nestedFunction' }, // inner
      ],
    },
  ],
});
