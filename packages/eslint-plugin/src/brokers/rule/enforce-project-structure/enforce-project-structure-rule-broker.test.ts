import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { enforceProjectStructureRuleBroker } from './enforce-project-structure-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-project-structure', enforceProjectStructureRuleBroker(), {
  valid: [
    // ========== VALID: All folder types at correct depth with correct naming ==========

    // Brokers (depth 2, camelCase + Broker)
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'export function apiClientBroker() { return null; }',
      filename: '/project/src/brokers/api/client/api-client-broker.ts',
    },

    // Contracts (depth 1, camelCase + Contract)
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: 'export const emailContract = z.string().email();',
      filename: '/project/src/contracts/email/email-contract.ts',
    },

    // Transformers (depth 1, camelCase + Transformer)
    {
      code: 'export const formatDateTransformer = () => {};',
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
    },

    // Guards (depth 1, camelCase + Guard)
    {
      code: 'export const hasPermissionGuard = () => true;',
      filename: '/project/src/guards/has-permission/has-permission-guard.ts',
    },

    // Errors (depth 1, PascalCase + Error)
    {
      code: 'export class ValidationError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
    },
    {
      code: 'export const UserNotFoundError = class extends Error {};',
      filename: '/project/src/errors/user-not-found/user-not-found-error.ts',
    },

    // Widgets (depth 1, PascalCase + Widget)
    {
      code: 'export const ButtonWidget = () => <div />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
    },

    // Responders (depth 2, PascalCase + Responder)
    {
      code: 'export const LoginResponder = () => null;',
      filename: '/project/src/responders/auth/login/login-responder.ts',
    },

    // Flows (depth 1, PascalCase + Flow)
    {
      code: 'export const LoginFlow = () => <div />;',
      filename: '/project/src/flows/login/login-flow.tsx',
    },

    // Statics (depth 1, camelCase + Statics)
    {
      code: 'export const configStatics = { apiUrl: "http://api.com" };',
      filename: '/project/src/statics/config/config-statics.ts',
    },

    // Bindings (depth 1, camelCase + Binding)
    {
      code: 'export const userStateBinding = () => {};',
      filename: '/project/src/bindings/user-state/user-state-binding.ts',
    },

    // State (depth 1, camelCase + State)
    {
      code: 'export const userCacheState = {};',
      filename: '/project/src/state/user-cache/user-cache-state.ts',
    },

    // Middleware (depth 1, camelCase + Middleware)
    {
      code: 'export const authMiddleware = () => {};',
      filename: '/project/src/middleware/auth/auth-middleware.ts',
    },

    // Adapters (depth 2, camelCase + Adapter, ONE function export only)
    {
      code: 'export const axiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
    },
    {
      code: 'export const fsReadFileAdapter = () => {};',
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // Adapters can compose multiple package functions for one operation
    {
      code: 'export const fsEnsureWriteAdapter = async () => {};',
      filename: '/project/src/adapters/fs/ensure-write/fs-ensure-write-adapter.ts',
    },

    // Startup (depth 0, PascalCase, 0 or 1 exports allowed)
    {
      code: 'export const StartApp = () => {};',
      filename: '/project/src/startup/start-app.ts',
    },
    {
      code: 'export function StartServer() { return null; }',
      filename: '/project/src/startup/start-server.ts',
    },
    {
      code: '// No exports - startup allows 0 exports\nconst init = () => {};',
      filename: '/project/src/startup/start-app.ts',
    },

    // Flows with .tsx suffix (array fileSuffix)
    {
      code: 'export const UserFlow = () => <div />;',
      filename: '/project/src/flows/user/user-flow.tsx',
    },

    // Widgets with .tsx suffix (array fileSuffix)
    {
      code: 'export const ModalWidget = () => <div />;',
      filename: '/project/src/widgets/modal/modal-widget.tsx',
    },

    // Type exports alongside the correct value export - should pass
    {
      code: 'export const userContract = z.object({}); export type User = z.infer<typeof userContract>;',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    {
      code: 'export class ValidationError extends Error {} export type ValidationErrorType = ValidationError;',
      filename: '/project/src/errors/validation/validation-error.ts',
    },
    {
      code: 'export const userFetchBroker = () => {}; export type HelperType = string;',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },

    // ========== SKIP CONDITIONS ==========
    // Files not in /src/
    {
      code: 'export const anything = () => {};',
      filename: '/project/lib/utils/anything.ts',
    },

    // Files directly in /src/
    {
      code: 'export const main = () => {};',
      filename: '/project/src/index.ts',
    },

    // Files with multiple dots (test files, stubs, etc.)
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },
    {
      code: 'export const UserStub = () => ({});',
      filename: '/project/src/contracts/user/user.stub.ts',
    },

    // ========== PROXY FILES: Valid arrow function exports ==========
    {
      code: 'export const httpAdapterProxy = () => {};',
      filename: '/project/src/adapters/http/get/http-adapter.proxy.ts',
    },
    {
      code: 'export const userFetchBrokerProxy = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },
    {
      code: 'export const hasPermissionGuardProxy = () => {};',
      filename: '/project/src/guards/has-permission/has-permission-guard.proxy.ts',
    },
    {
      code: 'export const formatDateTransformerProxy = () => {};',
      filename: '/project/src/transformers/format-date/format-date-transformer.proxy.ts',
    },
  ],

  invalid: [
    // ========== LEVEL 1: Forbidden/Unknown Folder Errors (HIGHEST) ==========
    {
      code: 'export const formatDate = () => {};',
      filename: '/project/src/utils/format-date.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'export const apiClient = () => {};',
      filename: '/project/src/lib/api-client.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'export const validateEmail = () => {};',
      filename: '/project/src/helpers/validate-email.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'export const userService = () => {};',
      filename: '/project/src/services/user-service.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'export type User = {};',
      filename: '/project/src/types/user.ts',
      errors: [{ messageId: 'forbiddenFolder' }],
    },
    {
      code: 'export const foo = "bar";',
      filename: '/project/src/unknown-folder/some-file.ts',
      errors: [{ messageId: 'unknownFolder' }],
    },

    // ========== LEVEL 2: Folder Depth Errors ==========
    // Brokers need depth 2, not 0 or 1
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },

    // Responders need depth 2, not 0 or 1
    {
      code: 'export const LoginResponder = () => null;',
      filename: '/project/src/responders/login-responder.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    {
      code: 'export const LoginResponder = () => null;',
      filename: '/project/src/responders/user/login-responder.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },

    // Guards need depth 1, not 2
    {
      code: 'export const isAdminGuard = () => true;',
      filename: '/project/src/guards/auth/admin/is-admin-guard.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },

    // Contracts need depth 1, not 2
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/model/user-contract.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },

    // Startup needs depth 0, not 1
    {
      code: 'export const StartApp = () => {};',
      filename: '/project/src/startup/app/start-app.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },

    // ========== LEVEL 2: Folder name kebab-case errors ==========
    // Folder name with uppercase
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/User/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCase' }],
    },
    // Folder name with underscore
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user_data/fetch/user-data-fetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCase' }],
    },

    // ========== LEVEL 3: Filename Suffix Errors ==========
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/user.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export const formatDateTransformer = () => {};',
      filename: '/project/src/transformers/format-date/format-date.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export const hasPermissionGuard = () => true;',
      filename: '/project/src/guards/has-permission/has-permission.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export class ValidationError extends Error {}',
      filename: '/project/src/errors/validation/validation.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export const ButtonWidget = () => <div />;',
      filename: '/project/src/widgets/button/button.tsx',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    {
      code: 'export const UserFlow = () => <div />;',
      filename: '/project/src/flows/user/user.tsx',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },

    // ========== LEVEL 4: Export Errors (structure is valid) ==========
    // Missing suffix (also triggers name mismatch)
    {
      code: 'export const userFetch = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export const user = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },

    // Wrong case (also triggers name mismatch)
    {
      code: 'export const UserFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export const UserContract = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export class validationError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export const buttonWidget = () => <div />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },

    // Name mismatch (wrong export name for filename)
    {
      code: 'export const dataSyncBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },
    {
      code: 'export const InputWidget = () => <div />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
      errors: [{ messageId: 'filenameMismatch' }],
    },

    // Wrong suffix (has suffix but wrong one for the folder)
    {
      code: 'export const userFetchTransformer = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export const formatDateBroker = () => {};',
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    {
      code: 'export class UserTransformer {}',
      filename: '/project/src/errors/user/user-error.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },

    // Test FunctionDeclaration (missing suffix + name mismatch)
    {
      code: 'export function userFetch() { return null; }',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },

    // Test ClassDeclaration (missing suffix + name mismatch)
    {
      code: 'export class Validation {}',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },

    // All three Level 4 errors at once (wrong suffix + wrong case + wrong name)
    {
      code: 'export const WrongNameTransformer = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [
        { messageId: 'invalidExportSuffix' },
        { messageId: 'invalidExportCase' },
        { messageId: 'filenameMismatch' },
      ],
    },
    {
      code: 'export const wrongNameBroker = () => {};',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [
        { messageId: 'invalidExportSuffix' },
        { messageId: 'invalidExportCase' },
        { messageId: 'filenameMismatch' },
      ],
    },

    // ========== HIERARCHICAL VALIDATION: Only ONE error per level ==========
    // Bad folder location -> ONLY reports forbidden folder, NOT depth or filename
    {
      code: 'export const whatever = () => {};',
      filename: '/project/src/utils/deep/nested/whatever.ts',
      errors: [
        { messageId: 'forbiddenFolder' },
        // Should NOT report depth or filename errors
      ],
    },

    // Bad depth -> reports ONLY depth, NOT filename or export errors
    {
      code: 'export const userBroker = () => {};',
      filename: '/project/src/brokers/user-broker.ts',
      errors: [
        { messageId: 'invalidFolderDepth' },
        // Should NOT report filename or export errors even though they're also wrong
      ],
    },

    // Bad filename -> reports ONLY filename, NOT export errors
    {
      code: 'export const userFetch = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch.ts',
      errors: [
        { messageId: 'invalidFileSuffix' },
        // Should NOT report export errors even though export is also wrong
      ],
    },

    // ========== LEVEL 3: Filename kebab-case errors ==========
    // Filename not kebab-case (has uppercase or underscore)
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/UserFetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCase' }],
    },
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user_fetch-broker.ts',
      errors: [{ messageId: 'invalidFilenameCase' }],
    },

    // Multiple Level 3 errors (both suffix AND kebab-case wrong)
    {
      code: 'export const RuleTester = () => {};',
      filename: '/project/src/adapters/eslint/rule-tester/eslintRuleTester.ts',
      errors: [{ messageId: 'invalidFileSuffix' }, { messageId: 'invalidFilenameCase' }],
    },
    {
      code: 'export const UserBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/UserFetch.ts',
      errors: [{ messageId: 'invalidFileSuffix' }, { messageId: 'invalidFilenameCase' }],
    },

    // ========== LEVEL 4: Export validation errors ==========

    // No exports at all
    {
      code: 'const helper = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },

    // Type-only exports (no value export)
    {
      code: 'export type User = { id: string };',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    {
      code: 'export interface Config { apiUrl: string; }',
      filename: '/project/src/statics/config/config-statics.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },

    // Default exports
    {
      code: 'const userFetchBroker = () => {}; export default userFetchBroker;',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noDefaultExport' }],
    },
    {
      code: 'export default class ValidationError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [{ messageId: 'noDefaultExport' }],
    },

    // Namespace exports
    {
      code: 'export * from "./helpers";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noNamespaceExport' }],
    },

    // Re-exports
    {
      code: 'export { userFetchBroker } from "./user-fetch-broker";',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'noReExport' }],
    },
    {
      code: 'export { z } from "zod";',
      filename: '/project/src/contracts/user/user-contract.ts',
      errors: [{ messageId: 'noReExport' }],
    },

    // Multiple value exports (even if one is correct)
    {
      code: 'export const userFetchBroker = () => {}; export const helper = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'multipleValueExports' }],
    },
    {
      code: 'export const helper1 = () => {}; export const helper2 = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'multipleValueExports' }],
    },
    {
      code: 'export class ValidationError extends Error {} export class OtherError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
      errors: [{ messageId: 'multipleValueExports' }],
    },

    // Destructured exports (not detected as value exports - ObjectPattern not Identifier)
    {
      code: 'const obj = {a: 1, b: 2}; export const {a, b} = obj;',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },

    // ========== ADAPTERS: Export validation ==========
    // Adapters need depth 2, not 1
    {
      code: 'export const axiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios-get-adapter.ts',
      errors: [{ messageId: 'invalidFolderDepth' }],
    },
    // Type re-export without -adapter.ts suffix (file suffix required for ALL adapters)
    {
      code: 'export type { Rule } from "eslint";',
      filename: '/project/src/adapters/eslint/rule/eslint-rule.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    // Missing Adapter suffix (also missing -adapter.ts file suffix)
    {
      code: 'export const axiosGet = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    // Wrong case (should be camelCase) - also missing file suffix
    {
      code: 'export const AxiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    // Wrong name - also missing file suffix
    {
      code: 'export const fetchDataAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get.ts',
      errors: [{ messageId: 'invalidFileSuffix' }],
    },
    // With correct file suffix, missing export Adapter suffix
    {
      code: 'export const axiosGet = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    // With correct file suffix, wrong export case
    {
      code: 'export const AxiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    // With correct file suffix, wrong export name
    {
      code: 'export const fetchDataAdapter = () => {};',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },
    // Adapters cannot have type-only re-exports (new pivot: must export functions returning contracts)
    {
      code: 'export type { Rule } from "eslint";',
      filename: '/project/src/adapters/eslint/rule/eslint-rule-adapter.ts',
      errors: [{ messageId: 'missingExpectedExport' }],
    },
    // Adapters cannot have class re-exports (must be functions returning contracts)
    {
      code: 'export { RuleTester as eslintRuleTesterAdapter } from "eslint";',
      filename: '/project/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts',
      errors: [{ messageId: 'noReExport' }],
    },
    // Adapters cannot have value re-exports (must be local function definitions)
    {
      code: 'import { get } from "axios";\nexport { get as axiosGetAdapter };',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'noReExport' }],
    },
    // Adapters cannot re-export via variable assignment (must be arrow functions)
    {
      code: 'import plugin from "@typescript-eslint/eslint-plugin";\nexport const typescriptEslintEslintPluginAdapter = plugin;',
      filename:
        '/project/src/adapters/typescript-eslint-eslint-plugin/adapter/typescript-eslint-eslint-plugin-adapter.ts',
      errors: [{ messageId: 'adapterMustBeArrowFunction' }],
    },
    // Adapters cannot use function declarations (must be arrow functions)
    {
      code: 'export function axiosGetAdapter() { return null; }',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'adapterMustBeArrowFunction' }],
    },
    // Adapters cannot export classes (must be arrow functions)
    {
      code: 'export class AxiosGetAdapter {}',
      filename: '/project/src/adapters/axios/get/axios-get-adapter.ts',
      errors: [{ messageId: 'adapterMustBeArrowFunction' }],
    },

    // ========== STARTUP: Export validation ==========
    // Multiple exports in startup (not allowed)
    {
      code: 'export const StartApp = () => {}; export const StartServer = () => {};',
      filename: '/project/src/startup/start-app.ts',
      errors: [{ messageId: 'multipleValueExports' }],
    },
    // Wrong case (should be PascalCase)
    {
      code: 'export const startApp = () => {};',
      filename: '/project/src/startup/start-app.ts',
      errors: [{ messageId: 'invalidExportCase' }, { messageId: 'filenameMismatch' }],
    },
    // Wrong name
    {
      code: 'export const StartServer = () => {};',
      filename: '/project/src/startup/start-app.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },

    // ========== PROXY FILES: Export validation ==========
    // Proxy with function declaration instead of arrow function
    {
      code: 'export function httpAdapterProxy() { return null; }',
      filename: '/project/src/adapters/http/get/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustBeArrowFunction' }],
    },
    // Proxy with class export
    {
      code: 'export class HttpAdapterProxy {}',
      filename: '/project/src/adapters/http/get/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustBeArrowFunction' }],
    },
    // Proxy with wrong export name (missing Proxy suffix)
    {
      code: 'export const httpAdapter = () => {};',
      filename: '/project/src/adapters/http/get/http-adapter.proxy.ts',
      errors: [{ messageId: 'invalidExportSuffix' }, { messageId: 'filenameMismatch' }],
    },
    // Broker proxy with function declaration
    {
      code: 'export function userFetchBrokerProxy() { return {}; }',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [{ messageId: 'proxyMustBeArrowFunction' }],
    },
    // Guard proxy with class
    {
      code: 'export class HasPermissionGuardProxy {}',
      filename: '/project/src/guards/has-permission/has-permission-guard.proxy.ts',
      errors: [{ messageId: 'proxyMustBeArrowFunction' }],
    },
    // Transformer proxy with incorrect name (doesn't match file)
    {
      code: 'export const wrongNameProxy = () => {};',
      filename: '/project/src/transformers/format-date/format-date-transformer.proxy.ts',
      errors: [{ messageId: 'filenameMismatch' }],
    },
  ],
});
