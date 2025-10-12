import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { banJestMockInTestsRuleBroker } from './ban-jest-mock-in-tests-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('ban-jest-mock-in-tests', banJestMockInTestsRuleBroker(), {
  valid: [
    // Non-mocking Jest functions are allowed
    {
      code: 'const mockFn = jest.fn();',
      filename: '/project/src/brokers/payment/payment-broker.test.ts',
    },
    {
      code: 'expect(jest.isMockFunction(fn)).toBe(true);',
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // All mocking is allowed in proxy files
    {
      code: "jest.mock('axios');",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: "jest.mock('../../adapters/http/http-adapter');",
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    {
      code: 'const mockAdapter = jest.mocked(httpAdapter);',
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    {
      code: "jest.spyOn(Date, 'now').mockReturnValue(1000);",
      filename: '/project/src/brokers/timestamp/timestamp-broker.proxy.ts',
    },
    {
      code: "jest.doMock('axios', () => ({ default: mockAxios }));",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: "jest.unmock('axios');",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: "jest.createMockFromModule('axios');",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: "const actual = jest.requireActual('fs');",
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },
    {
      code: 'jest.resetModules();',
      filename: '/project/src/brokers/config/config-broker.proxy.ts',
    },
    {
      code: "jest.replaceProperty(obj, 'key', 'value');",
      filename: '/project/src/state/config/config-state.proxy.ts',
    },

    // All mocking is allowed in non-test files
    {
      code: "jest.mock('../user-broker');",
      filename: '/project/src/brokers/user/user-setup.ts',
    },
    {
      code: "jest.spyOn(console, 'log');",
      filename: '/project/src/utils/logger.ts',
    },
  ],
  invalid: [
    // jest.mock() - npm packages
    {
      code: "jest.mock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
    {
      code: "jest.mock('fs/promises');",
      filename: '/project/src/adapters/fs/fs-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
    {
      code: "jest.mock('node:fs');",
      filename: '/project/src/adapters/fs/fs-read-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // jest.mock() - relative paths
    {
      code: "jest.mock('../../adapters/http/http-adapter');",
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
    {
      code: "jest.mock('../user-fetch-broker');",
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
    {
      code: "jest.mock('./user-helper');",
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // jest.mock() - workspace packages
    {
      code: "jest.mock('@questmaestro/shared');",
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // jest.mocked()
    {
      code: 'const mockHttp = jest.mocked(httpAdapter);',
      filename: '/project/src/brokers/api/api-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mocked' },
        },
      ],
    },
    {
      code: 'jest.mocked(userFetchBroker).mockResolvedValue(user);',
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mocked' },
        },
      ],
    },

    // jest.spyOn()
    {
      code: "jest.spyOn(Date, 'now').mockReturnValue(1000);",
      filename: '/project/src/brokers/timestamp/timestamp-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },
    {
      code: "jest.spyOn(console, 'log').mockImplementation();",
      filename: '/project/src/utils/logger.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },
    {
      code: "const spy = jest.spyOn(userCache, 'get');",
      filename: '/project/src/state/user-cache/user-cache-state.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },

    // jest.doMock()
    {
      code: "jest.doMock('axios', () => ({ default: mockAxios }));",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.doMock' },
        },
      ],
    },
    {
      code: "jest.doMock('../user-broker');",
      filename: '/project/src/brokers/user/user-update-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.doMock' },
        },
      ],
    },

    // Multiple violations in same file
    {
      code: `jest.mock('axios');
jest.mocked(httpAdapter);
jest.spyOn(Date, 'now');
jest.doMock('../user-broker');`,
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mocked' },
        },
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.spyOn' },
        },
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.doMock' },
        },
      ],
    },

    // Spec files
    {
      code: "jest.mock('../adapters/http/http-adapter');",
      filename: '/project/src/brokers/api/api-broker.spec.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // Integration test files
    {
      code: "jest.spyOn(dbAdapter, 'connect');",
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },

    // TSX test files
    {
      code: "jest.mock('../../../bindings/use-user/use-user-binding');",
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // jest.unmock()
    {
      code: "jest.unmock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.unmock' },
        },
      ],
    },

    // jest.deepUnmock()
    {
      code: "jest.deepUnmock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.deepUnmock' },
        },
      ],
    },

    // jest.dontMock()
    {
      code: "jest.dontMock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.dontMock' },
        },
      ],
    },

    // jest.setMock()
    {
      code: "jest.setMock('axios', mockAxios);",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.setMock' },
        },
      ],
    },

    // jest.createMockFromModule()
    {
      code: "const mockFs = jest.createMockFromModule('fs');",
      filename: '/project/src/adapters/fs/fs-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.createMockFromModule' },
        },
      ],
    },

    // jest.requireActual()
    {
      code: "const actualAxios = jest.requireActual('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.requireActual' },
        },
      ],
    },

    // jest.requireMock()
    {
      code: "const mockedAxios = jest.requireMock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.requireMock' },
        },
      ],
    },

    // jest.resetModules()
    {
      code: 'jest.resetModules();',
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.resetModules' },
        },
      ],
    },

    // jest.isolateModules()
    {
      code: 'jest.isolateModules(() => { require("./module"); });',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.isolateModules' },
        },
      ],
    },

    // jest.isolateModulesAsync()
    {
      code: 'await jest.isolateModulesAsync(async () => { await import("./module"); });',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.isolateModulesAsync' },
        },
      ],
    },

    // jest.replaceProperty()
    {
      code: "jest.replaceProperty(config, 'timeout', 5000);",
      filename: '/project/src/state/config/config-state.test.ts',
      errors: [
        {
          messageId: 'noMockingInTests',
          data: { mockFunction: 'jest.replaceProperty' },
        },
      ],
    },

    // Cleanup functions banned EVERYWHERE - test files
    {
      code: 'jest.clearAllMocks();',
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.clearAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetAllMocks();',
      filename: '/project/src/adapters/http/http-adapter.test.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetAllMocks' },
        },
      ],
    },
    {
      code: 'jest.restoreAllMocks();',
      filename: '/project/src/state/cache/cache-state.test.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.restoreAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetModuleRegistry();',
      filename: '/project/src/brokers/config/config-broker.test.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetModuleRegistry' },
        },
      ],
    },

    // Cleanup functions banned EVERYWHERE - proxy files
    {
      code: 'jest.clearAllMocks();',
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.clearAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetAllMocks();',
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetAllMocks' },
        },
      ],
    },
    {
      code: 'jest.restoreAllMocks();',
      filename: '/project/src/state/cache/cache-state.proxy.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.restoreAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetModuleRegistry();',
      filename: '/project/src/brokers/config/config-broker.proxy.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetModuleRegistry' },
        },
      ],
    },

    // Cleanup functions banned EVERYWHERE - regular files
    {
      code: 'jest.clearAllMocks();',
      filename: '/project/src/brokers/user/user-setup.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.clearAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetAllMocks();',
      filename: '/project/src/utils/test-helpers.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetAllMocks' },
        },
      ],
    },

    // Cleanup functions banned EVERYWHERE - integration/e2e test files
    {
      code: 'jest.clearAllMocks();',
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.clearAllMocks' },
        },
      ],
    },
    {
      code: 'jest.resetAllMocks();',
      filename: '/project/test/e2e/user-flow.e2e.ts',
      errors: [
        {
          messageId: 'noCleanupFunctions',
          data: { mockFunction: 'jest.resetAllMocks' },
        },
      ],
    },
  ],
});
