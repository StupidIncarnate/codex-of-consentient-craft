import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceOptionalGuardParamsBroker } from './rule-enforce-optional-guard-params-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-optional-guard-params', ruleEnforceOptionalGuardParamsBroker(), {
  valid: [
    {
      code: `export const isSomeGuard = ({ arg1, arg2 }: { arg1?: string; arg2?: number }): boolean => true;`,
      filename: '/project/src/guards/is-some/is-some-guard.ts',
    },
    {
      code: `export const hasPermissionGuard = ({ user, permission }: { user?: User; permission?: Permission }): boolean => true;`,
      filename: '/project/src/guards/has-permission/has-permission-guard.ts',
    },
    {
      code: `export const isValidGuard = ({ value }: { value?: string }): boolean => true;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
    },
    {
      code: `export const isCamelCaseGuard = ({ str }: { str?: string }): boolean => true;`,
      filename: '/project/src/guards/is-camel-case/is-camel-case-guard.ts',
    },
    {
      code: `export const isEntryFileGuard = ({ filePath, folderType }: { filePath?: string; folderType?: string }): boolean => true;`,
      filename: '/project/src/guards/is-entry-file/is-entry-file-guard.ts',
    },
    // Non-guard files should not be checked
    {
      code: `export const someFunction = ({ arg1, arg2 }: { arg1: string; arg2: number }): void => {};`,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: `export const someTransformer = ({ data }: { data: string }): string => data;`,
      filename: '/project/src/transformers/format/format-transformer.ts',
    },
    // Guards with no params are fine
    {
      code: `export const alwaysTrueGuard = (): boolean => true;`,
      filename: '/project/src/guards/always-true/always-true-guard.ts',
    },
  ],
  invalid: [
    {
      code: `export const isSomeGuard = ({ arg1, arg2 }: { arg1: string; arg2: number }): boolean => true;`,
      filename: '/project/src/guards/is-some/is-some-guard.ts',
      errors: [
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'arg1' } },
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'arg2' } },
      ],
    },
    {
      code: `export const hasPermissionGuard = ({ user, permission }: { user: User; permission: Permission }): boolean => true;`,
      filename: '/project/src/guards/has-permission/has-permission-guard.ts',
      errors: [
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'user' } },
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'permission' } },
      ],
    },
    {
      code: `export const isValidGuard = ({ value }: { value: string }): boolean => true;`,
      filename: '/project/src/guards/is-valid/is-valid-guard.ts',
      errors: [{ messageId: 'guardParamMustBeOptional', data: { propertyName: 'value' } }],
    },
    {
      code: `export const isCamelCaseGuard = ({ str }: { str: string }): boolean => true;`,
      filename: '/project/src/guards/is-camel-case/is-camel-case-guard.ts',
      errors: [{ messageId: 'guardParamMustBeOptional', data: { propertyName: 'str' } }],
    },
    {
      code: `export const isEntryFileGuard = ({ filePath, folderType }: { filePath: string; folderType: string }): boolean => true;`,
      filename: '/project/src/guards/is-entry-file/is-entry-file-guard.ts',
      errors: [
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'filePath' } },
        { messageId: 'guardParamMustBeOptional', data: { propertyName: 'folderType' } },
      ],
    },
    // Mixed optional and required - should report only required
    {
      code: `export const mixedGuard = ({ opt, req }: { opt?: string; req: number }): boolean => true;`,
      filename: '/project/src/guards/mixed/mixed-guard.ts',
      errors: [{ messageId: 'guardParamMustBeOptional', data: { propertyName: 'req' } }],
    },
  ],
});
