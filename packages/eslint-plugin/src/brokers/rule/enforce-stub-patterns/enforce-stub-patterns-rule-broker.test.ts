import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { enforceStubPatternsRuleBroker } from './enforce-stub-patterns-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-stub-patterns', enforceStubPatternsRuleBroker(), {
  valid: [
    // Object stub with spread operator, StubArgument type, and contract.parse() in expression body
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { userContract } from './user-contract';
export const UserStub = ({ ...props }: StubArgument<User> = {}): User =>
  userContract.parse({ id: '123', ...props });
      `,
      filename: '/test/user.stub.ts',
    },
    // Object stub with spread operator, StubArgument type, and contract.parse() in block body
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { astNodeContract } from './ast-node-contract';
export const AstNodeStub = ({ ...props }: StubArgument<AstNode> = {}): AstNode => {
  return astNodeContract.parse({
    type: 'Identifier',
    ...props,
  });
};
      `,
      filename: '/test/ast-node.stub.ts',
    },
    // Object stub with spread operator, StubArgument type, extra logic before contract.parse()
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { configContract } from './config-contract';
export const ConfigStub = ({ ...props }: StubArgument<Config> = {}): Config => {
  const defaults = { port: 3000 };
  return configContract.parse({ ...defaults, ...props });
};
      `,
      filename: '/test/config.stub.ts',
    },

    // Branded string stub with single 'value' property and contract.parse() - exception allowed
    {
      code: `
import { filePathContract } from './file-path-contract';
export const FilePathStub = ({ value }: { value: string } = { value: '/test/file.ts' }): FilePath =>
  filePathContract.parse(value);
      `,
      filename: '/test/file-path.stub.ts',
    },
    // Branded string stub with single 'value' property on multiple lines - exception allowed
    {
      code: `
import { allowedImportContract } from './allowed-import-contract';
export const AllowedImportStub = (
  { value }: { value: string } = { value: 'contracts' },
): AllowedImport => allowedImportContract.parse(value);
      `,
      filename: '/test/allowed-import.stub.ts',
    },

    // Stub with no parameters - should be ignored by rule
    {
      code: `
import { emptyContract } from './empty-contract';
export const EmptyStub = (): Empty => emptyContract.parse({});
      `,
      filename: '/test/empty.stub.ts',
    },

    // Stub with nested arrow functions for default function values - nested functions should not be checked
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { z } from 'zod';
import { eslintContextContract } from './eslint-context-contract';
const filenameContract = z.string().brand<'Filename'>();
export const EslintContextStub = ({ ...props }: StubArgument<EslintContext> = {}): EslintContext => {
  const { report, getFilename, ...dataProps } = props;
  return {
    ...eslintContextContract.parse({
      filename: filenameContract.parse('/test/file.ts'),
      ...dataProps,
    }),
    report: report ?? ((..._args: unknown[]): unknown => true),
    getFilename: getFilename ?? ((): string & z.BRAND<'Filename'> => filenameContract.parse('/test/file.ts')),
  };
};
      `,
      filename: '/test/eslint-context.stub.ts',
    },

    // Stub with contract.parse() assigned to variable, then spread in conditional returns
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { tsestreeContract } from './tsestree-contract';
export const TsestreeStub = ({ ...props }: StubArgument<Tsestree> = {}): Tsestree => {
  const { parent, ...dataProps } = props;
  const validated = tsestreeContract.parse({
    type: 'Identifier',
    ...dataProps,
  });
  if (parent !== undefined) {
    return {
      ...validated,
      parent: parent,
    };
  }
  return {
    ...validated,
    parent: null,
  };
};
      `,
      filename: '/test/tsestree.stub.ts',
    },

    // Non-stub file - rule should not apply
    {
      code: 'export const regularFunction = ({ props }: { props: SomeType }) => props',
      filename: '/test/regular.ts',
    },
    // Non-stub file - rule should not apply
    {
      code: 'const fn = ({ value }: { value: string }) => value',
      filename: '/test/transformer.ts',
    },
  ],
  invalid: [
    // Object stub missing spread operator - uses named property instead
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
export const UserStub = ({ props }: StubArgument<User> = {}): User => ({});
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useSpreadOperator' }],
    },
    // Object stub missing spread operator - uses Partial instead of StubArgument
    {
      code: `
export const AstNodeStub = ({ props }: Partial<AstNode> = {}): AstNode => ({});
      `,
      filename: '/test/ast-node.stub.ts',
      errors: [{ messageId: 'useSpreadOperator' }],
    },
    // Branded string stub (single value) missing contract.parse() - returns raw value
    {
      code: `
export const DataStub = ({ value }: { value: string }) => value;
      `,
      filename: '/test/data.stub.ts',
      errors: [{ messageId: 'useContractParse' }],
    },

    // Object stub with spread operator but wrong type - uses Partial instead of StubArgument
    {
      code: `
import { userContract } from './user-contract';
export const UserStub = ({ ...props }: Partial<User> = {}): User =>
  userContract.parse({ ...props });
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useStubArgumentType' }],
    },
    // Object stub with spread operator but wrong type - uses index signature instead of StubArgument
    {
      code: `
import { configContract } from './config-contract';
export const ConfigStub = ({ ...props }: { [key: string]: unknown } = {}) =>
  configContract.parse({});
      `,
      filename: '/test/config.stub.ts',
      errors: [{ messageId: 'useStubArgumentType' }],
    },

    // Object stub with spread operator and StubArgument but missing contract.parse() - returns object literal
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
export const UserStub = ({ ...props }: StubArgument<User> = {}): User => ({
  id: '123',
  ...props,
});
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useContractParse' }],
    },
    // Object stub with spread operator and StubArgument but missing contract.parse() - returns in block body
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
export const DataStub = ({ ...props }: StubArgument<Data> = {}): Data => {
  return { value: 'test', ...props };
};
      `,
      filename: '/test/data.stub.ts',
      errors: [{ messageId: 'useContractParse' }],
    },

    // Branded string stub (single value) missing contract.parse() - returns raw value directly
    {
      code: `
export const FilePathStub = ({ value }: { value: string } = { value: '/test' }): FilePath => value;
      `,
      filename: '/test/file-path.stub.ts',
      errors: [{ messageId: 'useContractParse' }],
    },

    // Object stub with multiple named properties (not spread) - should require spread operator
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { userContract } from './user-contract';
export const UserStub = ({ id, name }: StubArgument<User> = {}): User =>
  userContract.parse({ id, name });
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useSpreadOperator' }],
    },

    // Object stub with rest operator PLUS additional named property - should be pure spread only
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { userContract } from './user-contract';
export const UserStub = ({ id, ...props }: StubArgument<User> = {}): User =>
  userContract.parse({ id, ...props });
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useSpreadOperator' }],
    },

    // Single property NOT named 'value' - should either use spread or be named 'value'
    {
      code: `
import { dataContract } from './data-contract';
export const DataStub = ({ data }: { data: string } = { data: 'test' }): Data =>
  dataContract.parse(data);
      `,
      filename: '/test/data.stub.ts',
      errors: [{ messageId: 'useSpreadOperator' }],
    },

    // Object stub with contract.parse() but contract name doesn't end with 'Contract'
    {
      code: `
import type { StubArgument } from '@questmaestro/shared/@types';
import { userValidator } from './user-validator';
export const UserStub = ({ ...props }: StubArgument<User> = {}): User =>
  userValidator.parse({ id: '123', ...props });
      `,
      filename: '/test/user.stub.ts',
      errors: [{ messageId: 'useContractParse' }],
    },
  ],
});
