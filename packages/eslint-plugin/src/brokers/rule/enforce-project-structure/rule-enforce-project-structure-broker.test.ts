import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceProjectStructureBroker } from './rule-enforce-project-structure-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-project-structure', ruleEnforceProjectStructureBroker(), {
  valid: [
    // ========== END-TO-END VALID: Representative cases across folder types ==========
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: 'export class ValidationError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
    },
    {
      code: 'export const ButtonWidget = () => <div />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
    },
    {
      code: 'export const StartApp = () => {};',
      filename: '/project/src/startup/start-app.ts',
    },
    {
      code: 'export const axiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
    },
    {
      code: 'export const httpGetAdapterProxy = () => {};',
      filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
    },
    {
      code: 'export const validateFolderDepthLayerBroker = () => {};',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.ts',
    },

    // ========== SKIP CONDITIONS ==========
    {
      code: 'export const anything = () => {};',
      filename: '/project/lib/utils/anything.ts',
    },
    {
      code: 'export const main = () => {};',
      filename: '/project/src/index.ts',
    },
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },
  ],

  invalid: [
    // ========== GATE PATTERN: L1 fail stops L2/L3/L4 ==========
    // Forbidden folder -> ONLY L1 error, no depth/filename/export errors
    {
      code: 'export const whatever = () => {};',
      filename: '/project/src/utils/deep/nested/whatever.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    // Unknown folder -> ONLY L1 error
    {
      code: 'export const foo = "bar";',
      filename: '/project/src/unknown-folder/some-file.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
    // Layer file in disallowed folder -> ONLY L1 error
    {
      code: 'export const validateEmailLayerGuard = () => true;',
      filename: '/project/src/guards/validate-email/validate-email-layer-guard.ts',
      errors: [{ messageId: 'layerFilesNotAllowed' }],
    },

    // ========== GATE PATTERN: L2 fail stops L3/L4 ==========
    // Bad depth -> ONLY L2 error, NOT filename or export errors even though they may also be wrong
    {
      code: 'export const userBroker = () => {};',
      filename: '/project/src/brokers/user-broker.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    // Responder at wrong depth -> ONLY L2 error
    {
      code: 'export const LoginResponder = () => null;',
      filename: '/project/src/responders/login-responder.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    // Guard at wrong depth -> ONLY L2 error
    {
      code: 'export const isAdminGuard = () => true;',
      filename: '/project/src/guards/auth/admin/is-admin-guard.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    // Startup at wrong depth -> ONLY L2 error
    {
      code: 'export const StartApp = () => {};',
      filename: '/project/src/startup/app/start-app.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    // Folder name kebab-case error -> L2 stops further checks
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/User/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCase' }],
    },

    // ========== GATE PATTERN: L3 fail stops L4 ==========
    // Bad filename suffix -> ONLY L3 error, NOT export errors even though export is also wrong
    {
      code: 'export const userFetch = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch.ts',
      errors: [{ messageId: 'invalidFileSuffixWithLayer' }],
    },
    // Bad filename case -> ONLY L3 error
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/UserFetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCaseWithLayer' }],
    },
    // Both suffix AND case wrong -> multiple L3 errors but no L4
    {
      code: 'export const UserBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/UserFetch.ts',
      errors: [
        { messageId: 'invalidFileSuffixWithLayer' },
        { messageId: 'invalidFilenameCaseWithLayer' },
      ],
    },

    // ========== GATE PATTERN: L4a fail stops L4b ==========
    // Default export -> L4a error, no L4b validation
    {
      code: 'const userFetchBroker = () => {}; export default userFetchBroker;',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    // Namespace export -> L4a error, no L4b validation
    {
      code: 'export * from "./helpers";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noNamespaceExport' }],
    },
    // Re-export -> L4a error, no L4b validation
    {
      code: 'export { userFetchBroker } from "./user-fetch-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noReExport' }],
    },

    // ========== L4b: Export validation (all gates passed) ==========
    // Missing suffix + name mismatch
    {
      code: 'export const userFetch = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    // Wrong case + name mismatch
    {
      code: 'export const UserFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    // Name mismatch only
    {
      code: 'export const dataSyncBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },
    // No exports
    {
      code: 'const helper = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    // Multiple exports
    {
      code: 'export const userFetchBroker = () => {}; export const helper = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'multipleValueExports' }],
    },
    // All three L4b errors at once
    {
      code: 'export const WrongNameTransformer = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        { messageId: 'invalidExportSuffix' },
        { messageId: 'invalidExportCase' },
        { messageId: 'filenameMismatch' },
      ],
    },
  ],
});
