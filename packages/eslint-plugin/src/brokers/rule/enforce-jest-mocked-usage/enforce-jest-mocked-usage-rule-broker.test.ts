import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceJestMockedUsageRuleBroker } from './enforce-jest-mocked-usage-rule-broker';

const ruleTester = createEslintRuleTester();

ruleTester.run('enforce-jest-mocked-usage', enforceJestMockedUsageRuleBroker(), {
  valid: [
    // ✅ CORRECT: jest.mock() with jest.mocked()
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          mockAxios.get.mockResolvedValue({ data: 'test' });
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.mock() with jest.mocked() for named import
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsReadFileAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          mockReadFile.mockImplementation(async () => Buffer.from(''));
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-read-file-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.spyOn() for Date global
    {
      code: `
        export const dateNowAdapterProxy = () => {
          const mockDateNow = jest.spyOn(Date, 'now');
          mockDateNow.mockReturnValue(1609459200000);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/date/date-now-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.spyOn() for crypto global
    {
      code: `
        export const cryptoUuidAdapterProxy = () => {
          const mockUuid = jest.spyOn(crypto, 'randomUUID');
          mockUuid.mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/crypto/crypto-uuid-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.spyOn() for console global
    {
      code: `
        export const consoleLogAdapterProxy = () => {
          const mockConsoleLog = jest.spyOn(console, 'log');
          mockConsoleLog.mockImplementation(() => {});
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/console/console-log-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.spyOn() for Math global
    {
      code: `
        export const mathRandomAdapterProxy = () => {
          const mockRandom = jest.spyOn(Math, 'random');
          mockRandom.mockReturnValue(0.5);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/math/math-random-adapter.proxy.ts',
    },

    // ✅ CORRECT: jest.spyOn() for process global
    {
      code: `
        export const processExitAdapterProxy = () => {
          const mockExit = jest.spyOn(process, 'exit');
          mockExit.mockImplementation(() => undefined as never);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/process/process-exit-adapter.proxy.ts',
    },

    // ✅ Non-proxy files should be ignored
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        const mockAxios = axios;
        mockAxios.get.mockResolvedValue({ data: 'test' });
      `,
      filename: '/project/src/adapters/axios/axios-adapter.test.ts',
    },

    // ✅ Non-proxy files should be ignored (regular .ts file)
    {
      code: `
        import { readFile } from 'fs/promises';
        const file = readFile('test.txt');
      `,
      filename: '/project/src/adapters/fs/fs-adapter.ts',
    },

    // ✅ CORRECT: Multiple mocks with jest.mocked()
    {
      code: `
        import axios from 'axios';
        import { readFile } from 'fs/promises';
        jest.mock('axios');
        jest.mock('fs/promises');

        export const multiAdapterProxy = () => {
          const mockAxios = jest.mocked(axios);
          const mockReadFile = jest.mocked(readFile);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/multi/multi-adapter.proxy.ts',
    },
  ],

  invalid: [
    // ❌ WRONG: jest.mock() without jest.mocked()
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = axios;
          mockAxios.get.mockResolvedValue({ data: 'test' });
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useJestMocked',
          data: {
            moduleName: 'axios',
          },
        },
      ],
    },

    // ❌ WRONG: jest.mock() with type assertion instead of jest.mocked()
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const axiosAdapterProxy = () => {
          const mockAxios = axios as jest.MockedFunction<typeof axios>;
          mockAxios.get.mockResolvedValue({ data: 'test' });
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-adapter.proxy.ts',
      errors: [
        {
          messageId: 'useJestMocked',
          data: {
            moduleName: 'axios',
          },
        },
      ],
    },

    // ❌ WRONG: jest.spyOn() on module import
    {
      code: `
        import * as adapter from './adapter';

        export const adapterProxy = () => {
          const mockMethod = jest.spyOn(adapter, 'method');
          mockMethod.mockReturnValue('test');
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/some/some-adapter.proxy.ts',
      errors: [
        {
          messageId: 'spyOnModuleImport',
        },
      ],
    },

    // ❌ WRONG: jest.spyOn() on imported object
    {
      code: `
        import { fsReadFile } from '../fs/fs-adapter';

        export const fsAdapterProxy = () => {
          const mockReadFile = jest.spyOn(fsReadFile, 'read');
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-read-adapter.proxy.ts',
      errors: [
        {
          messageId: 'spyOnModuleImport',
        },
      ],
    },

    // ❌ WRONG: jest.spyOn() on default import
    {
      code: `
        import axios from 'axios';

        export const axiosAdapterProxy = () => {
          const mockGet = jest.spyOn(axios, 'get');
          mockGet.mockResolvedValue({ data: 'test' });
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/axios/axios-get-adapter.proxy.ts',
      errors: [
        {
          messageId: 'spyOnModuleImport',
        },
      ],
    },

    // ❌ WRONG: jest.spyOn() on named import
    {
      code: `
        import { readFile } from 'fs/promises';

        export const fsReadFileAdapterProxy = () => {
          const mockReadFile = jest.spyOn(readFile, 'toString');
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/fs/fs-read-file-adapter.proxy.ts',
      errors: [
        {
          messageId: 'spyOnModuleImport',
        },
      ],
    },

    // ❌ WRONG: Multiple jest.spyOn() calls on imports
    {
      code: `
        import axios from 'axios';
        import { readFile } from 'fs/promises';

        export const multiAdapterProxy = () => {
          const mockAxios = jest.spyOn(axios, 'get');
          const mockReadFile = jest.spyOn(readFile, 'toString');
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/adapters/multi/multi-adapter.proxy.ts',
      errors: [
        {
          messageId: 'spyOnModuleImport',
        },
        {
          messageId: 'spyOnModuleImport',
        },
      ],
    },
  ],
});
