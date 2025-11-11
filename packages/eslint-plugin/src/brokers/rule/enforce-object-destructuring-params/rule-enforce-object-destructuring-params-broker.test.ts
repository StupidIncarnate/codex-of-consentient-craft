import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceObjectDestructuringParamsBroker } from './rule-enforce-object-destructuring-params-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run(
  'enforce-object-destructuring-params',
  ruleEnforceObjectDestructuringParamsBroker(),
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

      // Non-exported functions are not checked
      'const fn = (user: string) => {}',
      'const fn = (id: number) => {}',
      'function transform(value: number): number { return value * 2; }',

      // Callback functions passed to library methods are not checked
      'z.string().refine((value) => value.length > 0)',
      'z.string().refine((value) => value.startsWith("/"))',
      'z.string().refine((path) => { return path.startsWith("/"); })',
      'const schema = z.string().refine((x) => x.length > 0, { message: "Required" })',
      'z.number().refine((n) => n > 0)',
      'z.array(z.string()).refine((arr) => arr.length > 0)',
      '[1, 2, 3].map((n) => n * 2)',
      '[1, 2, 3].filter((n) => n > 1)',
      '[1, 2, 3].forEach((n) => console.log(n))',
      '[1, 2, 3].find((n) => n === 2)',
      '[1, 2, 3].some((n) => n > 2)',
      '[1, 2, 3].every((n) => n > 0)',
      'users.map((user) => user.name)',

      // Object destructuring with default empty object
      'export const FolderTypeStub = ({ value = "contracts" } = {}) => value',
      'const fn = ({ x = 5 } = {}) => x',
      'const process = ({ data = "default" } = {}) => data',
      'export const stub = ({ id = "123" } = {}) => id',

      // Type predicates (TypeScript limitation: cannot use destructured parameters)
      'export const isString = (value: unknown): value is string => typeof value === "string"',
      'export const isUser = (data: unknown): data is User => typeof data === "object" && data !== null && "id" in data',
      'export const hasPermission = (user: unknown): user is UserWithPermission => typeof user === "object"',

      // Code examples in comments should not trigger
      '// Example: export const bad = (data: unknown) => data',
      '/* export function process(input: string): string { return input; } */',
      `
        // This is wrong - don't do this:
        // export const fn = (user: string, id: number) => {}
        export const fn = ({ user, id }: { user: string; id: number }) => {}
      `,
      `
        /*
         * Bad example:
         * export const process = (data: unknown) => data
         * export function handler(event: Event): void {}
         */
        export const process = ({ data }: { data: unknown }) => data
      `,
    ],
    invalid: [
      // Exported arrow function with positional param
      {
        code: 'export const process = (data: unknown) => data',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },
      {
        code: 'export const handler = (event: Event): void => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Exported function declaration with positional param
      {
        code: 'export function handler(event: Event): void {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Exported array destructuring (not object destructuring)
      {
        code: 'export const fn = ([a, b]: [string, number]) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Exported identifier without destructuring
      {
        code: 'export const fn = (param: { user: string; id: number }) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }],
      },

      // Exported multiple parameters - each must use object destructuring
      {
        code: 'export const fn = (a: string, b: number) => {}',
        errors: [{ messageId: 'useObjectDestructuring' }, { messageId: 'useObjectDestructuring' }],
      },
      {
        code: 'export const validateAdapterMockSetupLayerBroker = (functionNode: Tsestree, context: EslintContext): void => {}',
        errors: [{ messageId: 'useObjectDestructuring' }, { messageId: 'useObjectDestructuring' }],
      },
    ],
  },
);
