import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleEnforceImplementationColocationBroker } from './rule-enforce-implementation-colocation-broker';
import { ruleEnforceImplementationColocationBrokerProxy } from './rule-enforce-implementation-colocation-broker.proxy';

const ruleTester = ruleTesterHarness();

// Mock setup: return true only for specific existing files
beforeEach(() => {
  const proxy = ruleEnforceImplementationColocationBrokerProxy();

  proxy.setupFileSystem((filePath) => {
    const path = filePath;

    // Test files that exist (for valid cases)
    const existingTestFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      '/project/src/transformers/format-date/format-date-transformer.test.ts',
      '/project/src/brokers/axios/axios-get-broker.test.ts',
      '/project/src/brokers/http/http-broker.test.ts', // For invalid proxy pattern test
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
      '/project/src/statics/path/path-statics.test.ts',
      '/project/src/bindings/use-user-data/use-user-data-binding.test.ts',
      '/project/src/errors/validation/validation-error.test.ts',
      '/project/src/startup/start-server.integration.test.ts',
      '/project/src/startup/start-database.integration.test.ts',
      // Startup with forbidden unit test (for invalid case)
      '/project/src/startup/start-bad-unit.test.ts',
      // Startup with a colocated cross-package composing proxy — allowed (EPIC concession 2)
      '/project/src/startup/start-worker.integration.test.ts',
      // Flow with a colocated proxy — still forbidden, integration test present so the ONLY
      // error the invalid case below reports is forbiddenProxyFile
      '/project/src/flows/bad-proxy/bad-proxy-flow.integration.test.ts',
      // Responder test files (normal unit tests)
      '/project/src/responders/user/get/user-get-responder.test.ts',
      '/project/src/responders/user/create/validate-request-layer-responder.test.ts',
      // Flow integration test files
      '/project/src/flows/user/user-flow.integration.test.tsx',
      '/project/src/flows/api/api-flow.integration.test.ts',
      // Flow with forbidden unit test (for invalid case)
      '/project/src/flows/bad/bad-flow.test.ts',
      // Layer files
      '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.test.ts',
      '/project/src/widgets/user-card/avatar-layer-widget.test.tsx',
    ];

    if (existingTestFiles.includes(path)) {
      return true;
    }

    // Proxy files that exist (for valid cases)
    const existingProxyFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      '/project/src/transformers/format-date/format-date-transformer.proxy.ts',
      '/project/src/brokers/axios/axios-get-broker.proxy.ts',
      '/project/src/guards/has-permission/has-permission-guard.proxy.ts',
      '/project/src/widgets/my-component/my-component-widget.proxy.tsx',
      '/project/src/state/user-cache/user-cache-state.proxy.ts',
      '/project/src/middleware/http-telemetry/http-telemetry-middleware.proxy.ts',
      '/project/src/statics/user/user-statics.proxy.ts',
      '/project/src/bindings/use-user-data/use-user-data-binding.proxy.ts',
      '/project/src/brokers/payment/process/payment-process-broker.proxy.ts',
      '/project/src/transformers/validate-schema/validate-schema-transformer.proxy.ts',
      // Layer file proxies
      '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.proxy.ts',
      '/project/src/widgets/user-card/avatar-layer-widget.proxy.tsx',
      // Responder proxy files (normal proxies)
      '/project/src/responders/user/get/user-get-responder.proxy.ts',
      '/project/src/responders/user/create/validate-request-layer-responder.proxy.ts',
      // Startup's own cross-package composing proxy — allowed (EPIC concession 2)
      '/project/src/startup/start-worker.proxy.ts',
      // Flow proxy — still forbidden; exists on disk so the invalid case below can prove it
      // still gets flagged
      '/project/src/flows/bad-proxy/bad-proxy-flow.proxy.ts',
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
      '/project/src/brokers/http/http.proxy.ts', // Missing -broker
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
    // Package barrels: src/<folderType>/<folderType>.ts re-exporting only, no test or proxy
    {
      code: "export * from './user/user-contract';",
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
      code: "export * from './architecture/overview/architecture-overview-broker';",
      filename: '/project/src/brokers/brokers.ts',
    },
    {
      code: "export * from './user/user-statics';",
      filename: '/project/src/statics/statics.ts',
    },
    {
      code: "export * from './validation/validation-error';",
      filename: '/project/src/errors/errors.ts',
    },
    {
      code: "export type { StubArgument } from './stub-argument.type';",
      filename: '/project/src/@types/@types.ts',
    },
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
      code: 'export const axiosGetBroker = () => {};',
      filename: '/project/src/brokers/axios/axios-get-broker.ts',
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
    // Responder with test and proxy - valid (normal testable file)
    {
      code: 'export const UserGetResponder = () => {};',
      filename: '/project/src/responders/user/get/user-get-responder.ts',
    },
    {
      code: 'export const useUserDataBinding = () => {};',
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.ts',
    },
    // Statics with colocated test file - valid (testType: unit, test file exists)
    {
      code: 'export const userStatics = {};',
      filename: '/project/src/statics/user/user-statics.ts',
    },
    // Statics with no regex and no test file - valid (a statics file needs a test only
    // when it holds a regex; this one is pure data)
    {
      code: 'export const configStatics = {};',
      filename: '/project/src/statics/config/config-statics.ts',
    },
    // Statics with a regex literal AND a colocated test file - valid
    {
      code: 'export const pathStatics = { pattern: /^\\/[a-z]+$/u };',
      filename: '/project/src/statics/path/path-statics.ts',
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
    // Flow with integration test - valid (no proxy needed)
    {
      code: 'export const UserFlow = () => <Route />;',
      filename: '/project/src/flows/user/user-flow.tsx',
    },
    // Flow with integration test - valid
    {
      code: 'export const ApiFlow = () => {};',
      filename: '/project/src/flows/api/api-flow.ts',
    },
    {
      code: 'export const StartServer = () => {};',
      filename: '/project/src/startup/start-server.ts',
    },
    // Startup with integration test - valid
    {
      code: 'export const StartDatabase = () => {};',
      filename: '/project/src/startup/start-database.ts',
    },
    // Startup with BOTH an integration test AND a colocated proxy - valid (EPIC concession 2):
    // a startup file may carry a cross-package composing proxy another workspace package's
    // tests import, the way start-orchestrator.ts does for StartOrchestrator.
    {
      code: 'export const StartWorker = () => {};',
      filename: '/project/src/startup/start-worker.ts',
    },

    // Layer files with colocated tests and proxies
    {
      code: 'export const validateFolderDepthLayerBroker = () => {};',
      filename:
        '/project/src/brokers/rule/enforce-project-structure/validate-folder-depth-layer-broker.ts',
    },
    {
      code: 'export const AvatarLayerWidget = () => <div />;',
      filename: '/project/src/widgets/user-card/avatar-layer-widget.tsx',
    },
    // Layer responder with test and proxy - valid (normal testable file)
    {
      code: 'export const ValidateRequestLayerResponder = () => {};',
      filename: '/project/src/responders/user/create/validate-request-layer-responder.ts',
    },
  ],
  invalid: [
    // A barrel-named file holding an implementation is graded like any other file
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/project/src/brokers/brokers.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    {
      code: "import { z } from 'zod';\nexport * from './user/user-contract';",
      filename: '/project/src/brokers/brokers.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    // A barrel-named file one folder too deep is not a barrel
    {
      code: "export * from './user/user-contract';",
      filename: '/project/src/brokers/brokers/brokers.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    // Statics with a regex literal and no test file - invalid: the regex is logic,
    // so it still needs a colocated test even though plain statics data does not
    {
      code: 'export const urlStatics = { pattern: /^https?:\\/\\//u };',
      filename: '/project/src/statics/url/url-statics.ts',
      errors: [{ messageId: 'missingTestFileWithLayer' }],
    },
    // Implementation files without tests or proxy
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/project/src/brokers/order/fetch/order-fetch-broker.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    {
      code: 'export const axiosPostBroker = () => {};',
      filename: '/project/src/brokers/axios/axios-post-broker.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    {
      code: 'export const isAdminGuard = () => {};',
      filename: '/project/src/guards/is-admin/is-admin-guard.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const ButtonWidget = () => <button />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    // Contract without test file (will report both missing test and missing stub)
    {
      code: 'export const productContract = z.object({});',
      filename: '/project/src/contracts/product/product-contract.ts',
      errors: [{ messageId: 'missingTestFileWithLayer' }, { messageId: 'missingStubFile' }],
    },
    // Contract with test but without stub file
    {
      code: 'export const orderContract = z.object({});',
      filename: '/project/src/contracts/order/order-contract.ts',
      errors: [{ messageId: 'missingStubFile' }],
    },
    // Proxy file exists but with incorrect naming pattern (missing -broker)
    {
      code: 'export const httpBroker = () => {};',
      filename: '/project/src/brokers/http/http-broker.ts',
      errors: [{ messageId: 'invalidProxyFilename' }],
    },
    // Proxy file exists but with incorrect naming pattern (missing -create-broker)
    {
      code: 'export const orderCreateBroker = () => {};',
      filename: '/project/src/brokers/order/create/order-create-broker.ts',
      errors: [{ messageId: 'invalidProxyFilename' }],
    },

    // Layer files without colocated proxy and test files (should fail)
    {
      code: 'export const checkBrokerMockSetupLayerBroker = () => {};',
      filename:
        '/project/src/brokers/rule/enforce-proxy-patterns/check-broker-mock-setup-layer-broker.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    {
      code: 'export const UserInfoLayerWidget = () => <div />;',
      filename: '/project/src/widgets/profile/user-info-layer-widget.tsx',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },
    {
      code: 'export const ProcessPaymentLayerResponder = () => {};',
      filename: '/project/src/responders/checkout/process/process-payment-layer-responder.ts',
      errors: [
        { messageId: 'missingTestFileWithLayer' },
        { messageId: 'missingProxyFileWithLayer' },
      ],
    },

    // Startup files - require integration tests, forbid unit tests
    {
      code: 'export const StartCache = () => {};',
      filename: '/project/src/startup/start-cache.ts',
      errors: [{ messageId: 'missingIntegrationTestFile' }],
    },
    {
      code: 'export const StartBadUnit = () => {};',
      filename: '/project/src/startup/start-bad-unit.ts',
      errors: [{ messageId: 'forbiddenUnitTestFile' }],
    },

    // Flow files - require integration tests, forbid unit tests and proxies
    {
      code: 'export const SettingsFlow = () => {};',
      filename: '/project/src/flows/settings/settings-flow.ts',
      errors: [{ messageId: 'missingIntegrationTestFile' }],
    },
    {
      code: 'export const BadFlow = () => {};',
      filename: '/project/src/flows/bad/bad-flow.ts',
      errors: [{ messageId: 'forbiddenUnitTestFile' }],
    },
    // A flow with a colocated proxy is STILL flagged — the startup exemption above (EPIC
    // concession 2) is scoped to startup files only; a flow's own integration test already
    // exercises real dependencies, so a proxy beside it stays dead weight.
    {
      code: 'export const BadProxyFlow = () => {};',
      filename: '/project/src/flows/bad-proxy/bad-proxy-flow.ts',
      errors: [{ messageId: 'forbiddenProxyFile' }],
    },
  ],
});
