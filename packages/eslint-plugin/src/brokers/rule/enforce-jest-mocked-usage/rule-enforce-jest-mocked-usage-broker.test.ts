import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceJestMockedUsageBroker } from './rule-enforce-jest-mocked-usage-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-jest-mocked-usage', ruleEnforceJestMockedUsageBroker(), {
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

    // ✅ CORRECT: Non-adapter proxies should NOT use jest.mocked() - they delegate to adapters
    {
      code: `
        import { httpAdapterProxy } from '../../../adapters/http/http-adapter.proxy';

        export const userFetchBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          return {
            setupUserFetch: ({ userId, user }) => {
              httpProxy.returns({ url: \`/users/\${userId}\`, response: { data: user } });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },

    // ✅ CORRECT: Widget proxy delegates to broker proxy
    {
      code: `
        import { userFetchBrokerProxy } from '../../../brokers/user/fetch/user-fetch-broker.proxy';

        export const userCardWidgetProxy = () => {
          const brokerProxy = userFetchBrokerProxy();
          return {
            setupUserCard: ({ userId, user }) => {
              brokerProxy.setupUserFetch({ userId, user });
            }
          };
        };
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.proxy.ts',
    },

    // ✅ CORRECT: Responder proxy delegates to broker proxy
    {
      code: `
        import { userCreateBrokerProxy } from '../../../brokers/user/create/user-create-broker.proxy';

        export const userCreateResponderProxy = () => {
          const brokerProxy = userCreateBrokerProxy();
          return {
            setupUserCreate: ({ userData, user }) => {
              brokerProxy.setupUserCreate({ userData, user });
            }
          };
        };
      `,
      filename: '/project/src/responders/user/create/user-create-responder.proxy.ts',
    },

    // ✅ CORRECT: Binding proxy delegates to broker proxy
    {
      code: `
        import { userFetchBrokerProxy } from '../../../brokers/user/fetch/user-fetch-broker.proxy';

        export const useUserDataBindingProxy = () => {
          const brokerProxy = userFetchBrokerProxy();
          return {
            setupUserData: ({ userId, user }) => {
              brokerProxy.setupUserFetch({ userId, user });
            }
          };
        };
      `,
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.proxy.ts',
    },

    // ✅ CORRECT: Middleware proxy delegates to adapter proxies
    {
      code: `
        import { logAdapterProxy } from '../../../adapters/winston/log-adapter.proxy';
        import { metricsAdapterProxy } from '../../../adapters/prometheus/metrics-adapter.proxy';

        export const telemetryMiddlewareProxy = () => {
          const logProxy = logAdapterProxy();
          const metricsProxy = metricsAdapterProxy();
          return {
            setupTelemetry: () => {
              logProxy.setupLog({ message: 'test' });
              metricsProxy.setupMetrics({ name: 'test' });
            }
          };
        };
      `,
      filename: '/project/src/middleware/telemetry/telemetry-middleware.proxy.ts',
    },

    // ✅ CORRECT: State proxy - clears state without mocking
    {
      code: `
        import { userCacheState } from './user-cache-state';

        export const userCacheStateProxy = () => {
          userCacheState.clear();
          return {
            setupCachedUser: ({ userId, user }) => {
              userCacheState.set({ id: userId, user });
            }
          };
        };
      `,
      filename: '/project/src/state/user-cache/user-cache-state.proxy.ts',
    },

    // ✅ CORRECT: State proxy can use jest.mocked() for external systems (Redis, DB)
    {
      code: `
        import { RedisClient } from 'redis';
        jest.mock('redis');

        export const redisStateProxy = () => {
          const mockRedis = jest.mocked(RedisClient);
          mockRedis.connect.mockResolvedValue(undefined);
          return {
            setupConnection: () => {
              mockRedis.get.mockResolvedValue('cached-value');
            }
          };
        };
      `,
      filename: '/project/src/state/redis/redis-state.proxy.ts',
    },

    // ✅ CORRECT: Guard proxy builds test data, doesn't mock
    {
      code: `
        import { UserStub } from '../../../contracts/user/user.stub';

        export const hasEditPermissionGuardProxy = () => {
          return {
            setupForOwnProfileEdit: ({ userId }) => {
              return UserStub({ id: userId, isAdmin: false });
            },
            setupForAdminEdit: () => {
              return UserStub({ isAdmin: true });
            }
          };
        };
      `,
      filename: '/project/src/guards/has-edit-permission/has-edit-permission-guard.proxy.ts',
    },

    // ✅ CORRECT: Transformer proxy builds test data
    {
      code: `
        import { UserStub } from '../../../contracts/user/user.stub';

        export const userToDtoTransformerProxy = () => {
          return {
            buildUserWithAllFields: () => {
              return UserStub({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' });
            }
          };
        };
      `,
      filename: '/project/src/transformers/user-to-dto/user-to-dto-transformer.proxy.ts',
    },

    // Code examples in comments should not trigger
    {
      code: '// Example: const mock = axios as jest.Mocked<typeof axios>',
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: '/* const mockFn = readFile as jest.MockedFunction<typeof readFile> */',
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },
    {
      code: `
        // This is wrong - don't do this:
        // const mockAxios = axios as jest.Mocked<typeof axios>
        jest.mock('axios');
        const mockAxios = jest.mocked(axios);
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    {
      code: `
        /*
         * Bad examples:
         * const mock = fs as jest.Mocked<typeof fs>
         * const mockFn = readFile as jest.MockedFunction<typeof readFile>
         */
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');
        export const fsAdapterProxy = () => {
          const mockReadFile = jest.mocked(readFile);
          return {};
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
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

    // ❌ WRONG: Broker proxy using jest.mocked() on adapter
    {
      code: `
        import { httpAdapter } from '../../../adapters/http/http-adapter';
        jest.mock('../../../adapters/http/http-adapter');

        export const userFetchBrokerProxy = () => {
          const mockAdapter = jest.mocked(httpAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Widget proxy using jest.mocked() on binding
    {
      code: `
        import { useUserDataBinding } from '../../../bindings/use-user-data/use-user-data-binding';
        jest.mock('../../../bindings/use-user-data/use-user-data-binding');

        export const userCardWidgetProxy = () => {
          const mockBinding = jest.mocked(useUserDataBinding);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Responder proxy using jest.mocked() on broker
    {
      code: `
        import { userCreateBroker } from '../../../brokers/user/create/user-create-broker';
        jest.mock('../../../brokers/user/create/user-create-broker');

        export const userCreateResponderProxy = () => {
          const mockBroker = jest.mocked(userCreateBroker);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/responders/user/create/user-create-responder.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Binding proxy using jest.mocked() on broker
    {
      code: `
        import { userFetchBroker } from '../../../brokers/user/fetch/user-fetch-broker';
        jest.mock('../../../brokers/user/fetch/user-fetch-broker');

        export const useUserDataBindingProxy = () => {
          const mockBroker = jest.mocked(userFetchBroker);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/bindings/use-user-data/use-user-data-binding.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Middleware proxy using jest.mocked() on adapter (should use adapter proxy instead)
    {
      code: `
        import { logAdapter } from '../../../adapters/winston/log-adapter';
        jest.mock('../../../adapters/winston/log-adapter');

        export const telemetryMiddlewareProxy = () => {
          const mockLog = jest.mocked(logAdapter);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/middleware/telemetry/telemetry-middleware.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Guard proxy using jest.mocked()
    {
      code: `
        import { hasPermissionGuard } from '../../../guards/has-permission/has-permission-guard';
        jest.mock('../../../guards/has-permission/has-permission-guard');

        export const hasEditPermissionGuardProxy = () => {
          const mockGuard = jest.mocked(hasPermissionGuard);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/guards/has-edit-permission/has-edit-permission-guard.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },

    // ❌ WRONG: Transformer proxy using jest.mocked()
    {
      code: `
        import { formatDateTransformer } from '../../../transformers/format-date/format-date-transformer';
        jest.mock('../../../transformers/format-date/format-date-transformer');

        export const userToDtoTransformerProxy = () => {
          const mockFormat = jest.mocked(formatDateTransformer);
          return { /* proxy methods */ };
        };
      `,
      filename: '/project/src/transformers/user-to-dto/user-to-dto-transformer.proxy.ts',
      errors: [
        {
          messageId: 'nonAdapterNoJestMocked',
        },
      ],
    },
  ],
});
