import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceImplementationTestingRuleBroker } from './enforce-implementation-testing-rule-broker';
import { fsExistsSync } from '../../../adapters/fs/fs-exists-sync';

jest.mock('../../../adapters/fs/fs-exists-sync');

const mockFsExistsSync = jest.mocked(fsExistsSync);
const ruleTester = createEslintRuleTester();

// Mock setup: return true only for specific existing files
beforeEach(() => {
  mockFsExistsSync.mockImplementation(({ filePath }) => {
    const path = String(filePath);

    // Test files that exist (for valid cases)
    const existingTestFiles = [
      '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      '/project/src/transformers/format-date/format-date-transformer.test.ts',
      '/project/src/adapters/axios/axios-get.test.ts',
      '/project/src/guards/has-permission/has-permission-guard.test.ts',
      '/project/src/widgets/my-component/my-component-widget.test.tsx',
      '/project/src/contracts/user/user-contract.test.ts',
      '/project/src/contracts/order/order-contract.test.ts',
      '/project/src/utils/helper/helper-utils.spec.ts',
      '/project/src/services/auth/auth-service.spec.ts',
      '/project/src/brokers/payment/process/payment-process-broker.integration.test.ts',
      '/project/src/transformers/validate-schema/validate-schema-transformer.integration.spec.ts',
    ];

    if (existingTestFiles.includes(path)) {
      return true;
    }

    // Stub files that exist
    const existingStubFiles = ['/project/src/contracts/user/user.stub.ts'];

    if (existingStubFiles.includes(path)) {
      return true;
    }

    return false;
  });
});

ruleTester.run('enforce-implementation-testing', enforceImplementationTestingRuleBroker(), {
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
      code: 'export const axiosGet = () => {};',
      filename: '/project/src/adapters/axios/axios-get.ts',
    },
    {
      code: 'export const hasPermissionGuard = () => {};',
      filename: '/project/src/guards/has-permission/has-permission-guard.ts',
    },
    {
      code: 'export const MyComponent = () => <div />;',
      filename: '/project/src/widgets/my-component/my-component-widget.tsx',
    },
    // Implementation files with spec files instead of test files
    {
      code: 'export const helperUtils = () => {};',
      filename: '/project/src/utils/helper/helper-utils.ts',
    },
    {
      code: 'export const authService = () => {};',
      filename: '/project/src/services/auth/auth-service.ts',
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
  ],
  invalid: [
    // Implementation files without tests
    {
      code: 'export const orderFetchBroker = () => {};',
      filename: '/project/src/brokers/order/fetch/order-fetch-broker.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const parseJsonTransformer = () => {};',
      filename: '/project/src/transformers/parse-json/parse-json-transformer.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const axiosPost = () => {};',
      filename: '/project/src/adapters/axios/axios-post.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const isAdminGuard = () => {};',
      filename: '/project/src/guards/is-admin/is-admin-guard.ts',
      errors: [{ messageId: 'missingTestFile' }],
    },
    {
      code: 'export const ButtonWidget = () => <button />;',
      filename: '/project/src/widgets/button/button-widget.tsx',
      errors: [{ messageId: 'missingTestFile' }],
    },
    // Contract without test file
    {
      code: 'export const productContract = z.object({});',
      filename: '/project/src/contracts/product/product-contract.ts',
      errors: [{ messageId: 'missingContractTestFile' }],
    },
    // Contract with test but without stub file
    {
      code: 'export const orderContract = z.object({});',
      filename: '/project/src/contracts/order/order-contract.ts',
      errors: [{ messageId: 'missingStubFile' }],
    },
  ],
});
