import { ruleBanJestMockInProxiesBroker } from './rule-ban-jest-mock-in-proxies-broker';
import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('ban-jest-mock-in-proxies', ruleBanJestMockInProxiesBroker(), {
  valid: [
    // registerMock is allowed in proxy files
    {
      code: `
        import { writeFile } from 'fs/promises';
        import { registerMock } from '@dungeonmaster/testing/register-mock';
        const handle = registerMock({ fn: writeFile });
      `,
      filename: '/project/src/adapters/fs/write-file/fs-write-file-adapter.proxy.ts',
    },

    // jest.fn() is allowed in proxy files (not a banned function)
    {
      code: 'const mockFn = jest.fn();',
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },

    // jest.mock() is allowed in non-proxy files (test files handled by ban-jest-mock-in-tests)
    {
      code: "jest.mock('axios');",
      filename: '/project/src/adapters/http/http-adapter.test.ts',
    },

    // jest.mocked() is allowed in non-proxy files
    {
      code: 'const mock = jest.mocked(httpAdapter);',
      filename: '/project/src/adapters/http/http-adapter.test.ts',
    },

    // jest.spyOn() is allowed in non-proxy files
    {
      code: "jest.spyOn(Date, 'now').mockReturnValue(1000);",
      filename: '/project/src/brokers/timestamp/timestamp-broker.test.ts',
    },

    // jest.requireActual is allowed inside registerModuleMock factory callbacks
    {
      code: `
        registerModuleMock({
          module: '@dungeonmaster/orchestrator',
          factory: () => ({
            ...jest.requireActual('@dungeonmaster/orchestrator'),
            questModifyBroker: jest.fn(),
          }),
        });
      `,
      filename: '/project/src/brokers/quest/modify/quest-modify-broker.proxy.ts',
    },

    // Regular files are not affected
    {
      code: "jest.mock('axios');",
      filename: '/project/src/brokers/user/user-broker.ts',
    },
  ],
  invalid: [
    // jest.mock() banned in proxy files
    {
      code: "jest.mock('axios');",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
    {
      code: "jest.mock('fs/promises');",
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },

    // jest.mocked() banned in proxy files
    {
      code: 'const mock = jest.mocked(axios.get);',
      filename: '/project/src/adapters/http/get/http-get-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mocked' },
        },
      ],
    },

    // jest.spyOn() banned in proxy files
    {
      code: "jest.spyOn(Date, 'now').mockReturnValue(1000);",
      filename: '/project/src/brokers/timestamp/timestamp-broker.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },
    {
      code: "jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid');",
      filename: '/project/src/adapters/crypto/random-uuid/crypto-random-uuid-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },

    // jest.doMock() banned in proxy files
    {
      code: "jest.doMock('axios', () => ({ default: mockAxios }));",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.doMock' },
        },
      ],
    },

    // jest.unmock() banned in proxy files
    {
      code: "jest.unmock('axios');",
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.unmock' },
        },
      ],
    },

    // jest.requireActual() banned in proxy files
    {
      code: "const actual = jest.requireActual('fs');",
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.requireActual' },
        },
      ],
    },

    // jest.resetModules() banned in proxy files
    {
      code: 'jest.resetModules();',
      filename: '/project/src/brokers/config/config-broker.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.resetModules' },
        },
      ],
    },

    // jest.replaceProperty() banned in proxy files
    {
      code: "jest.replaceProperty(obj, 'key', 'value');",
      filename: '/project/src/state/config/config-state.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.replaceProperty' },
        },
      ],
    },

    // Multiple violations in same file
    {
      code: `jest.mock('axios');
const mock = jest.mocked(axios.get);
jest.spyOn(Date, 'now');`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mock' },
        },
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mocked' },
        },
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.spyOn' },
        },
      ],
    },

    // TSX proxy files
    {
      code: "jest.mock('../../../bindings/use-user/use-user-binding');",
      filename: '/project/src/widgets/user-card/user-card-widget.proxy.tsx',
      errors: [
        {
          messageId: 'useRegisterMock',
          data: { mockFunction: 'jest.mock' },
        },
      ],
    },
  ],
});
