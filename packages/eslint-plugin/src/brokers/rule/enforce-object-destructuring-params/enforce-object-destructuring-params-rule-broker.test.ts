import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceObjectDestructuringParamsRuleBroker } from './enforce-object-destructuring-params-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run(
  'enforce-object-destructuring-params',
  enforceObjectDestructuringParamsRuleBroker(),
  {
    valid: [
      // Object destructuring with single param
      'const fn = ({ user }: { user: string }) => {}',
      'const fn = ({ user, id }: { user: string; id: number }) => {}',
      'function fn({ user }: { user: string }) {}',
      'const obj = { method({ user }: { user: string }) {} }',

      // No parameters
      'const fn = () => {}',
      'function fn() {}',
      'const obj = { method() {} }',

      // Arrow functions with destructuring
      'const fn = ({ data }: { data: unknown }) => data',
      'export const process = ({ input }: { input: string }): string => input',

      // Function declarations with destructuring
      'function transform({ value }: { value: number }): number { return value * 2; }',
      'export function handler({ event }: { event: Event }): void {}',

      // Nested object destructuring
      'const fn = ({ user: { name } }: { user: { name: string } }) => {}',

      // Rest parameters in destructuring
      'const fn = ({ a, ...rest }: { a: string; [key: string]: unknown }) => {}',

      // Nested functions should NOT be checked
      'const fn = ({ user }: { user: string }) => { const inner = (x: number) => x * 2; }',
      'function outer({ data }: { data: string }) { function inner(x: number) { return x; } }',
      'const fn = ({ config }: { config: object }) => { return function(y: string) { return y; }; }',
      'const fn = ({ data }: { data: unknown }) => (x: number) => x',
    ],
    invalid: [
      // Single positional parameter
      {
        code: 'const fn = (user: string) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },
      {
        code: 'const fn = (id: number) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Arrow function with positional param
      {
        code: 'const process = (data: unknown) => data',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },
      {
        code: 'export const handler = (event: Event): void => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Function declaration with positional param
      {
        code: 'function transform(value: number): number { return value * 2; }',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },
      {
        code: 'export function handler(event: Event): void {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Function expression with positional param
      {
        code: 'const obj = { method(user: string) {} }',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Array destructuring (not object destructuring)
      {
        code: 'const fn = ([a, b]: [string, number]) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Identifier without destructuring
      {
        code: 'const fn = (param: { user: string; id: number }) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },
    ],
  },
);
