import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleEnforceProjectStructureBroker } from './rule-enforce-project-structure-broker';

const ruleTester = ruleTesterHarness();

ruleTester.run('enforce-project-structure', ruleEnforceProjectStructureBroker(), {
  valid: [
    // ========== PACKAGE BARRELS: src/<folderType>/<folderType>.ts re-exporting only ==========
    {
      code: "export * from './user/user-contract';\nexport * from './order/order-contract';",
      filename: '/project/src/contracts/contracts.ts',
    },
    {
      code: "export * from './is-key-of/is-key-of-guard';",
      filename: '/project/src/guards/guards.ts',
    },
    {
      code: "export * from './format-date/format-date-transformer';",
      filename: '/project/src/transformers/transformers.ts',
    },
    {
      code: "export * from './user/user-statics';",
      filename: '/project/src/statics/statics.ts',
    },
    {
      code: "export * from './architecture/overview/architecture-overview-broker';",
      filename: '/project/src/brokers/brokers.ts',
    },
    {
      code: "export * from './validation/validation-error';",
      filename: '/project/src/errors/errors.ts',
    },
    {
      code: "export type { StubArgument } from './stub-argument.type';",
      filename: '/project/src/@types/@types.ts',
    },
    {
      code: "export { userContract } from './user/user-contract';\nexport type { User } from './user/user-contract';",
      filename: '/project/src/contracts/contracts.ts',
    },

    // ========== CALLER-PROXY ANCHOR: src/startup/start-<pkg>.ts re-exporting only ==========
    {
      code: "export { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';",
      filename: '/project/src/startup/start-config.ts',
    },
    {
      code: 'export const configResolveBrokerProxy = () => {};',
      filename: '/project/src/startup/start-config.proxy.ts',
    },
    {
      code: 'export const StartOrchestratorProxy = () => {};',
      filename: '/project/src/startup/start-orchestrator.proxy.ts',
    },

    // ========== END-TO-END VALID: Representative cases across folder types ==========
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    // Types-only contract: a function type or method set Zod cannot check
    {
      code: 'export type UserLoader = (id: string) => void;',
      filename: '/project/src/contracts/user-loader/user-loader-contract.ts',
    },
    {
      code: 'export interface UserApi { load: () => void; clear: () => void }',
      filename: '/project/src/contracts/user-api/user-api-contract.ts',
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
      code: 'export const httpGetBrokerProxy = () => {};',
      filename: '/project/src/brokers/http/get/http-get-broker.proxy.ts',
    },
    {
      code: 'export const validateFolderDepthLayerBroker = () => {};',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.ts',
    },
    // Layer files now allowed in contracts/, transformers/, statics/ and bindings/
    {
      code: 'export const toolUseLayerContract = z.object({});',
      filename: '/project/src/contracts/assistant-stream-line/tool-use-layer-contract.ts',
    },
    {
      code: 'export const decodeBodyLayerTransformer = () => {};',
      filename: '/project/src/transformers/parse-response/decode-body-layer-transformer.ts',
    },
    {
      code: 'export const banListLayerStatics = {};',
      filename: '/project/src/statics/eslint-rule/ban-list-layer-statics.ts',
    },
    {
      code: 'export const useScrollPositionLayerBinding = () => {};',
      filename: '/project/src/bindings/use-quest-chat/use-scroll-position-layer-binding.ts',
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
    // ========== CALLER-PROXY ANCHOR IMPOSTERS ==========
    {
      code: "export { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';\nexport const StartConfig = () => {};",
      filename: '/project/src/startup/start-config.ts',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: "export { configResolveBroker } from '../brokers/config/resolve/config-resolve-broker';",
      filename: '/project/src/brokers/config/resolve/config-resolve-broker.ts',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: 'export const configResolveBroker = () => {};',
      filename: '/project/src/startup/start-config.proxy.ts',
      errors: [{ messageId: 'invalidExportSuffix' }],
    },
    {
      code: 'export const otherBrokerProxy = () => {};',
      filename: '/project/src/brokers/config/resolve/config-resolve-broker.proxy.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },

    // ========== PACKAGE BARREL IMPOSTERS ==========
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/contracts.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    {
      code: "import { z } from 'zod';\nexport * from './user/user-contract';",
      filename: '/project/src/contracts/contracts.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    {
      code: "export * from './user/user-contract';",
      filename: '/project/src/contracts/contracts/contracts.ts',
      errors: [{ messageId: 'invalidFileSuffixWithLayer' }],
    },
    {
      code: "export * from './user/user-contract';",
      filename: '/project/src/brokers/brokers/brokers.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    {
      code: "export * from './user/user-contract';",
      filename: '/project/src/contracts/user/contracts.ts',
      errors: [
        { messageId: 'invalidFileSuffixWithLayer' },
        { messageId: 'invalidFilenameCaseWithLayer' },
      ],
    },
    {
      code: "export * from './x/x-thing';",
      filename: '/project/src/things/things.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
    {
      code: 'export const stubArgument = 1;',
      filename: '/project/src/@types/@types.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },
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
    // adapters/ is not a folder type -> ONLY L1 error, even for a well-formed adapter file
    {
      code: 'export const axiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [
        {
          messageId: 'unknownFolder',
          data: {
            folder: 'adapters',
            allowed:
              'statics, contracts, guards, transformers, errors, flows, middleware, brokers, bindings, state, responders, widgets, startup, assets, migrations',
          },
        },
      ],
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
    // Empty contract file is still missing its export
    {
      code: 'const helper = () => {};',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    // Type-only exports satisfy only a contract file
    {
      code: 'export type IsAdmin = (id: string) => boolean;',
      filename: '/project/src/guards/is-admin/is-admin-guard.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    {
      code: 'export type Config = { port: number };',
      filename: '/project/src/statics/config/config-statics.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    {
      code: 'export type UserFetch = () => void;',
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
