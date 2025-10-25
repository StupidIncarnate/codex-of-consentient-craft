import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleBanPrimitivesBroker } from './rule-ban-primitives-broker';

const ruleTester = eslintRuleTesterAdapter();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFAULT CONFIG: Both inputs and returns require branded types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ruleTester.run('ban-primitives (default: strict)', ruleBanPrimitivesBroker(), {
  valid: [
    'const foo: UserId = "123"',
    'const bar: EmailAddress = "test@example.com"',
    'function baz(id: UserId): UserName { return "John" as UserName; }',
    'type User = { id: UserId; name: UserName; }',
    'const count: PositiveNumber = 42 as PositiveNumber;',
    'type User = { tags: Tag[]; scores: Score[]; }',
    'const foo = (tags: Tag[]): Score[] => []',

    // Code examples in comments should not trigger
    '// Example: const name: string = "John"',
    '/* Bad example: function foo(id: number): string {} */',
    `
      // This is wrong - don't do this:
      // const count: number = 42
      const count: PositiveNumber = 42 as PositiveNumber;
    `,
    `
      /*
       * Wrong example:
       * type User = { id: string; age: number; }
       */
      type User = { id: UserId; age: Age; }
    `,

    // Stub files are allowed to use primitives
    {
      code: 'export const UserIdStub = ({ value }: { value: string } = { value: "123" }): UserId => value as UserId;',
      filename: 'user-id.stub.ts',
    },
    {
      code: 'export const FilePathStub = ({ value }: { value: string }): FilePath => value as FilePath;',
      filename: 'contracts/file-path/file-path.stub.ts',
    },
    {
      code: 'export const CountStub = ({ value }: { value: number } = { value: 0 }): Count => value as Count;',
      filename: 'src/contracts/count/count.stub.ts',
    },
    {
      code: 'export const stub = (props: { id: string; count: number }): Thing => props;',
      filename: 'thing.stub.ts',
    },
  ],
  invalid: [
    {
      code: 'const foo: string = "bar"',
      errors: [{ messageId: 'banPrimitive' }],
    },
    {
      code: 'const count: number = 42',
      errors: [{ messageId: 'banPrimitive' }],
    },
    {
      code: 'function foo(name: string): void {}',
      errors: [{ messageId: 'banPrimitive' }],
    },
    {
      code: 'function foo(age: number): void {}',
      errors: [{ messageId: 'banPrimitive' }],
    },
    {
      code: 'type User = { id: string; age: number; }',
      errors: [{ messageId: 'banPrimitive' }, { messageId: 'banPrimitive' }],
    },
    {
      code: 'const foo = (bar: string): number => 42',
      errors: [{ messageId: 'banPrimitive' }, { messageId: 'banPrimitive' }],
    },
    {
      code: 'const foo = (items: string[]): number[] => []',
      errors: [{ messageId: 'banPrimitive' }, { messageId: 'banPrimitive' }],
    },
    {
      code: 'type Config = { url: string; port: number; timeout: number; }',
      errors: [
        { messageId: 'banPrimitive' },
        { messageId: 'banPrimitive' },
        { messageId: 'banPrimitive' },
      ],
    },
    {
      code: 'const transformer = ({ input }: { input: string }): string => input;',
      errors: [{ messageId: 'banPrimitive' }, { messageId: 'banPrimitive' }],
    },
  ],
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG: allowPrimitiveInputs = true (RECOMMENDED FOR INTERNAL CODE)
// Allow raw string/number inputs, require branded returns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ruleTester.run('ban-primitives (allowPrimitiveInputs: true)', ruleBanPrimitivesBroker(), {
  valid: [
    // ✅ VALID: Primitives in parameters are allowed
    {
      code: 'export const transformer = ({ input }: { input: string }): BrandedString => input as BrandedString;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
    },
    {
      code: 'export const guard = ({ str }: { str: string }): boolean => str.length > 0;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
    },
    {
      code: 'function calculate(amount: number): Currency { return amount as Currency; }',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
    },
    {
      code: 'const fn = (a: string, b: number): Result => ({ a, b } as Result);',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
    },
    // ✅ VALID: Branded return types
    {
      code: 'const fn = (input: string): FileName => input as FileName;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
    },
  ],
  invalid: [
    // ❌ INVALID: Raw string return type
    {
      code: 'export const transformer = ({ input }: { input: UserId }): string => input;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Raw number return type
    {
      code: 'function calculate(amount: Currency): number { return 42; }',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Arrow function with raw return
    {
      code: 'const fn = (a: BrandedString, b: BrandedNumber): string => a;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Variable declarations still need brands
    {
      code: 'const userId: string = "123";',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Object properties in type definitions still need brands
    {
      code: 'type User = { id: string; };',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: false }],
      errors: [{ messageId: 'banPrimitive' }],
    },
  ],
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG: allowPrimitiveReturns = true (NOT RECOMMENDED)
// Require branded inputs, allow raw returns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ruleTester.run('ban-primitives (allowPrimitiveReturns: true)', ruleBanPrimitivesBroker(), {
  valid: [
    // ✅ VALID: Primitives in return types allowed
    {
      code: 'export const transformer = ({ input }: { input: BrandedString }): string => input;',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
    },
    {
      code: 'function calculate(amount: Currency): number { return 42; }',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
    },
    {
      code: 'const fn = (a: UserId): string => a;',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
    },
  ],
  invalid: [
    // ❌ INVALID: Raw string input parameter
    {
      code: 'export const transformer = ({ input }: { input: string }): BrandedString => input as BrandedString;',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Raw number input parameter
    {
      code: 'function calculate(amount: number): Currency { return amount as Currency; }',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Variable declarations still need brands
    {
      code: 'const userId: string = "123";',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // ❌ INVALID: Object properties still need brands
    {
      code: 'type User = { id: string; };',
      options: [{ allowPrimitiveInputs: false, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
  ],
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIG: Both true (allows primitives in params AND returns - NOT RECOMMENDED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ruleTester.run('ban-primitives (both options true)', ruleBanPrimitivesBroker(), {
  valid: [
    {
      code: 'function calc(a: number, b: number): number { return a + b; }',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: true }],
    },
    {
      code: 'const fn = (x: string): string => x;',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: true }],
    },
  ],
  invalid: [
    // Still errors on variable declarations
    {
      code: 'const userId: string = "123";',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
    // Still errors on object properties in type definitions
    {
      code: 'type User = { id: string; };',
      options: [{ allowPrimitiveInputs: true, allowPrimitiveReturns: true }],
      errors: [{ messageId: 'banPrimitive' }],
    },
  ],
});
