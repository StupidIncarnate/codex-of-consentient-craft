import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceImplementationColocationBroker } from './rule-enforce-implementation-colocation-broker';
import { ruleEnforceImplementationColocationBrokerProxy } from './rule-enforce-implementation-colocation-broker.proxy';

const ruleTester = eslintRuleTesterAdapter();

// Mock setup: return true only for specific existing files
beforeEach(() => {
  const proxy = ruleEnforceImplementationColocationBrokerProxy();
  const adapterProxy = proxy.fsExistsSync;

  adapterProxy.setupFileSystem((filePath) => {
    const path = String(filePath);

    // Test files that exist (for valid cases)
    const existingTestFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      '/project/src/transformers/format-date/format-date-transformer.test.ts',
      '/project/src/adapters/axios/axios-get-adapter.test.ts',
      '/project/src/adapters/http/http-adapter.test.ts', // For invalid proxy pattern test
      '/project/src/brokers/order/create/order-create-broker.test.ts', // For invalid proxy pattern test
      '/project/src/transformers/parse-json/parse-json-transformer.test.ts', // For invalid proxy pattern test
      '/project/src/guards/has-permission/has-permission-guard.test.ts',
      '/project/src/widgets/my-component/my-component-widget.test.tsx',
      '/project/src/contracts/user/user-contract.test.ts',
      '/project/src/contracts/order/order-contract.test.ts',
      '/project/src/brokers/payment/process/payment-process-broker.integration.test.ts',
      '/project/src/transformers/validate-schema/validate-schema-transformer.integration.spec.ts',
      '/project/src/state/user-cache/user-cache-state.test.ts',
      '/project/src/middleware/http-telemetry/http-telemetry-middleware.test.ts',
      '/project/src/statics/user/user-statics.test.ts',
      '/project/src/responders/user/get/user-get-responder.test.ts',
      '/project/src/bindings/use-user-data/use-user-data-binding.test.ts',
      '/project/src/errors/validation/validation-error.test.ts',
      '/project/src/flows/user/user-flow.integration.test.tsx',
      '/project/src/startup/start-server.integration.test.ts',
    ];

    if (existingTestFiles.includes(path)) {
      return true;
    }

    // Proxy files that exist (for valid cases)
    const existingProxyFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      '/project/src/transformers/format-date/format-date-transformer.proxy.ts',
      '/project/src/adapters/axios/axios-get-adapter.proxy.ts',
      '/project/src/guards/has-permission/has-permission-guard.proxy.ts',
      '/project/src/widgets/my-component/my-component-widget.proxy.tsx',
      '/project/src/state/user-cache/user-cache-state.proxy.ts',
      '/project/src/middleware/http-telemetry/http-telemetry-middleware.proxy.ts',
      '/project/src/statics/user/user-statics.proxy.ts',
      '/project/src/responders/user/get/user-get-responder.proxy.ts',
      '/project/src/bindings/use-user-data/use-user-data-binding.proxy.ts',
      '/project/src/brokers/payment/process/payment-process-broker.proxy.ts',
      '/project/src/transformers/validate-schema/validate-schema-transformer.proxy.ts',
    ];

    if (existingProxyFiles.includes(path)) {
      return true;
    }

    // Stub files that exist
    const existingStubFiles = ['/project/src/contracts/user/user.stub.ts'];

    if (existingStubFiles.includes(path)) {
      return true;
    }

    // Invalid proxy filename patterns (for testing validation)
    const invalidProxyFiles = [
      '/project/src/adapters/http/http.proxy.ts', // Missing -adapter
      '/project/src/brokers/order/create/order.proxy.ts', // Missing -create-broker
      '/project/src/transformers/parse-json/parse.proxy.ts', // Missing -json-transformer
    ];

    if (invalidProxyFiles.includes(path)) {
      return true;
    }

    return false;
  });
});

ruleTester.run('enforce-implementation-colocation', ruleEnforceImplementationColocationBroker(), {
  valid: [
    // Implementation files with colocated tests
    {
      code: 'export const userFetchBroker = () => {};',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.ts',
    },
    {
      code: 'export const formatDateTransformer = () => {};',
      filename: '/project/src/transformers/format-date/format-date-transformer.ts',
    },
    {
      code: 'export const axiosGetAdapter = () => {};',
      filename: '/project/src/adapters/axios/axios-get-adapter.ts',
    },
    {
      code: 'export const hasPermissionGuard = () => {};',
      filename: '/project/src/guards/has-permission/has-permission-guard.ts',
    },
    {
      code: 'export const MyComponent = () => <div />;',
      filename: '/project/src/widgets/my-component/my-component-widget.tsx',
    },
    // Implementation files with integration test files
    {
      code: 'export const paymentProcessBroker = () => {};',
      filename: '/project/src/brokers/payment/process/payment-process-broker.ts',
    },
    {
      code: 'export const validateSchemaTransformer = () => {};',
      filename: '/project/src/transformers/validate-schema/validate-schema-transformer.ts',
    },
    // Contract with both test and stub files
    {
      code: 'export const userContract = z.object({});',
      filename: '/project/src/contracts/user/user-contract.ts',
    },
    // Files that should be skipped
    {
      code: 'describe("test", () => {});',
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
    },
    {
      code: 'export const UserStub = () => ({});',
      filename: '/project/src/contracts/user/user.stub.ts',
    },
    {
      code: 'declare module "test" {}',
      filename: '/project/src/@types/test.d.ts',
    },
    {
      code: 'export const config = {};',
      filename: '/project/config.ts',
    },
    // Testable files with both test and proxy files
    {
      code: 'export const userCacheState = {};',
      filename: '/project/src/state/user-cache/user-cache-state.ts',
    },
    {
      code: 'export const httpTelemetryMiddleware = () => {};',
      filename: '/project/src/middleware/http-telemetry/http-telemetry-middleware.ts',
    },
    {
      code: 'export const UserGetResponder = () => {};',
      filename: '/project/src/responders/user/get/user-get-responder.ts',
    },
    {
      code: 'export const useUserDataBinding = () => {};',
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.ts',
    },
    // Statics don't need tests (just data)
    {
      code: 'export const userStatics = {};',
      filename: '/project/src/statics/user/user-statics.ts',
    },
    {
      code: 'export const configStatics = {};',
      filename: '/project/src/statics/config/config-statics.ts',
    },
    // Additional files with multiple dots that should be skipped
    {
      code: 'export const appConfigStatics = {};',
      filename: '/project/src/statics/app-config/app.config.ts',
    },
    {
      code: 'export const helperUtilsTransformer = {};',
      filename: '/project/src/transformers/helper-utils/helper-utils.spec.ts',
    },
    {
      code: 'export const integrationE2eBroker = {};',
      filename: '/project/src/brokers/integration/integration.e2e.ts',
    },
    {
      code: 'export type Globals = {};',
      filename: '/project/src/contracts/globals/global.d.ts',
    },
    {
      code: 'export const userFixtureContract = {};',
      filename: '/project/src/contracts/user/user.stub.ts',
    },
    // Files that do NOT need proxy files (per testing-standards.md:403-418)
    {
      code: 'export class ValidationError extends Error {}',
      filename: '/project/src/errors/validation/validation-error.ts',
    },
    {
      code: 'export const UserFlow = () => <Route />;',
      filename: '/project/src/flows/user/user-flow.tsx',
    },
    {
      code: 'export const StartServer = () => {};',
      filename: '/project/src/startup/start-server.ts',
    },
  ],
  invalid: [
    // Implementation files without tests or proxy
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/project/src/brokers/order/fetch/order-fetch-broker.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    {
      code: 'export const axiosPostAdapter = () => {};',
      filename: '/project/src/adapters/axios/axios-post-adapter.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    {
      code: 'export const isAdminGuard = () => {};',
      filename: '/project/src/guards/is-admin/is-admin-guard.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const ButtonWidget = () => <button />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingProxyFile' }],
    },
    // Contract without test file (will report both missing test and missing stub)
    {
      code: 'export const productContract = z.object({});',
      filename: '/project/src/contracts/product/product-contract.ts',
      errors: [{ messageId: 'missingTestFile' }, { messageId: 'missingStubFile' }],
    },
    // Contract with test but without stub file
    {
      code: 'export const orderContract = z.object({});',
      filename: '/project/src/contracts/order/order-contract.ts',
      errors: [{ messageId: 'missingStubFile' }],
    },
    // Proxy file exists but with incorrect naming pattern (missing -adapter)
    {
      code: 'export const httpAdapter = () => {};',
      filename: '/project/src/adapters/http/http-adapter.ts',
      errors: [{ messageId: 'invalidProxyFilename' }],
    },
    // Proxy file exists but with incorrect naming pattern (missing -create-broker)
    {
      code: 'export const orderCreateBroker = () => {};',
      filename: '/project/src/brokers/order/create/order-create-broker.ts',
      errors: [{ messageId: 'invalidProxyFilename' }],
    },
  ],
});
