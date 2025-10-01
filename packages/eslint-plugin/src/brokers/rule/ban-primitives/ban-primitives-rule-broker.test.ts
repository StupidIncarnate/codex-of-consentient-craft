import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { banPrimitivesRuleBroker } from './ban-primitives-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('ban-primitives', banPrimitivesRuleBroker(), {
  valid: [
    'const foo: UserId = "123"',
    'const bar: EmailAddress = "test@example.com"',
    'function baz(id: UserId): UserName { return "John" as UserName; }',
    'type User = { id: UserId; name: UserName; }',
    'const count: PositiveNumber = 42 as PositiveNumber;',
    'type User = { tags: Tag[]; scores: Score[]; }',
    'const foo = (tags: Tag[]): Score[] => []',
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
  ],
});
