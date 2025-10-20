import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleExplicitReturnTypesBroker } from './rule-explicit-return-types-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('explicit-return-types', ruleExplicitReturnTypesBroker(), {
  valid: [
    'export const foo = (): string => "bar"',
    'export const bar = (): number => 42',
    'export function baz(): void {}',
    'export default function qux(): boolean { return true; }',
    'export default (): string => "bar"',
    'const internal = () => "not exported"',
    'function internal() { return "not exported"; }',
    'export const foo = (): Promise<string> => Promise.resolve("bar")',
    'export async function bar(): Promise<void> {}',
    'export const a = (): void => {}, b = (): number => 42',
    'export function* gen(): Generator<number> { yield 1; }',
    'export const higherOrder = (): (() => void) => () => {}',
    'export class ValidationError extends Error { constructor(message: string) { super(message); } }',
    'class InternalClass { method() { return "ok"; } }',
  ],
  invalid: [
    {
      code: 'export const foo = () => "bar"',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export function foo() { return "bar"; }',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export default function foo() { return "bar"; }',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export default () => "bar"',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export async function foo() { return "bar"; }',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export const foo = async () => "bar"',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export const a = (): void => {}, b = () => 42',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export function* gen() { yield 1; }',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: 'export const higherOrder = () => () => {}',
      errors: [{ messageId: 'missingReturnType' }],
    },
    {
      code: `
        export const foo = () => "bar";
        export function baz() { return 42; }
      `,
      errors: [{ messageId: 'missingReturnType' }, { messageId: 'missingReturnType' }],
    },
  ],
});
