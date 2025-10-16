import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { banPrimitivesRuleBroker } from './ban-primitives-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-primitives', banPrimitivesRuleBroker(), {
  valid: [
    'const foo: UserId = "123"',
    'const bar: EmailAddress = "test@example.com"',
    'function baz(id: UserId): UserName { return "John" as UserName; }',
    'type User = { id: UserId; name: UserName; }',
    'const count: PositiveNumber = 42 as PositiveNumber;',
    'type User = { tags: Tag[]; scores: Score[]; }',
    'const foo = (tags: Tag[]): Score[] => []',

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
  ],
});
