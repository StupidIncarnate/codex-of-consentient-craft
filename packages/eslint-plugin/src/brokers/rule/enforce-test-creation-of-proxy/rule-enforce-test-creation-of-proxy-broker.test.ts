import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceTestCreationOfProxyBroker } from './rule-enforce-test-creation-of-proxy-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-test-creation-of-proxy', ruleEnforceTestCreationOfProxyBroker(), {
  valid: [
    // Proxy created inside it() block
    {
      code: `
        it('should fetch user', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Proxy created inside test() block
    {
      code: `
        test('should fetch user', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Multiple proxies created inside test block
    {
      code: `
        it('should create user', () => {
          const userBrokerProxy = userBrokerProxy();
          const httpAdapterProxy = httpAdapterProxy();

          userBrokerProxy.setupUser({ userId, user });
          httpAdapterProxy.returnsSuccess();
        });
      `,
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
    },

    // Proxy created in each test (fresh instances)
    {
      code: `
        it('test 1', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });

        it('test 2', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-proxy variables at module level are fine
    {
      code: `
        const userId = '123';
        const userName = 'John Doe';

        it('should work', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user: { name: userName } });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Functions at module level are fine
    {
      code: `
        const createTestUser = () => ({ id: '123', name: 'Test' });

        it('should work', () => {
          const userBrokerProxy = userBrokerProxy();
          const user = createTestUser();
          userBrokerProxy.setupUser({ userId: user.id, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Proxy files can have module-level proxy creation
    {
      code: `
        const userBrokerProxy = userBrokerProxy();
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },

    // Non-test files can have module-level proxy creation
    {
      code: `
        const userBrokerProxy = userBrokerProxy();
      `,
      filename: '/project/src/utils/test-helpers.ts',
    },

    // TSX test files with proxy inside test
    {
      code: `
        it('should render', () => {
          const userBindingProxy = userBindingProxy();
          userBindingProxy.returnsUser({ user });
        });
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
    },

    // Integration test files - no proxy imports, runs real code
    {
      code: `
        import { installTestbedCreateBroker } from '@dungeonmaster/testing';

        it('should complete user flow', () => {
          const testbed = installTestbedCreateBroker({ baseName: 'test' });
          // Real implementation runs
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
    },

    // E2E test files - no proxy imports, runs real code
    {
      code: `
        it('should complete end-to-end flow', () => {
          // Real implementation runs
        });
      `,
      filename: '/project/src/tests/login.e2e.test.ts',
    },

    // Harness created inside describe() in integration test - ALLOWED (correct scope)
    {
      code: `
        import { questHarness } from '../../test/harnesses/quest/quest.harness';

        describe('OrchestrationFlow', () => {
          const harness = questHarness();

          it('should complete quest flow', () => {
            harness.create({ guildId: '123' });
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Harness created inside describe() in e2e test - ALLOWED
    {
      code: `
        import { guildHarness } from '../../test/harnesses/guild/guild.harness';

        describe('GuildDisplay', () => {
          const harness = guildHarness();

          it('should display guilds', () => {
            harness.create({ name: 'Test' });
          });
        });
      `,
      filename: '/project/src/tests/guilds.e2e.test.ts',
    },

    // Multiple harnesses inside same describe - ALLOWED
    {
      code: `
        describe('OrchestrationFlow', () => {
          const queue = orchestrationQueueHarness();
          const envHarness = orchestrationEnvironmentHarness();

          it('should work', () => {});
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Harness inside nested describe - ALLOWED
    {
      code: `
        describe('outer', () => {
          describe('inner', () => {
            const harness = questHarness();
            it('test', () => {});
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Harness inside beforeAll() within describe - ALLOWED (describeDepth > 0, testBlockDepth === 0)
    {
      code: `
        describe('OrchestrationFlow', () => {
          beforeAll(() => {
            const harness = questHarness();
          });

          it('test', () => {});
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Proxy called without assignment (empty proxy, no setup needed)
    {
      code: `
        it('should work', () => {
          userBrokerProxy();

          const result = userBroker();
          expect(result).toBeDefined();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Proxy called without assignment before implementation
    {
      code: `
        it('should work', () => {
          tsconfigBrokerProxy();
          const result = tsconfigBroker();
          expect(result).toBeDefined();
        });
      `,
      filename: '/project/src/brokers/config/tsconfig/config-tsconfig-broker.test.ts',
    },

    // Layer broker with proxy created inside test
    {
      code: `
        it('should validate mocks', () => {
          const proxy = validateAdapterMockSetupLayerBrokerProxy();
          validateAdapterMockSetupLayerBroker(functionNode, mockContext);
        });
      `,
      filename:
        '/project/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.test.ts',
    },

    // Layer broker with proxy called without assignment
    {
      code: `
        it('should validate mocks', () => {
          validateAdapterMockSetupLayerBrokerProxy();
          validateAdapterMockSetupLayerBroker(functionNode, mockContext);
        });
      `,
      filename:
        '/project/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.test.ts',
    },

    // StartEndpointMock.listen() used as proxy-equivalent mock setup for adapters
    {
      code: `
        it('should fetch data', () => {
          const endpoint = StartEndpointMock.listen({method: 'get', url: '/test/endpoint'});
          endpoint.resolves({data: {key: 'value'}});

          const result = fetchGetAdapter({url: '/test/endpoint'});
        });
      `,
      filename: '/project/src/adapters/fetch/get/fetch-get-adapter.test.ts',
    },

    // StartEndpointMock.listen() with multiple tests
    {
      code: `
        it('test 1', () => {
          const endpoint = StartEndpointMock.listen({method: 'post', url: '/test/endpoint'});
          endpoint.resolves({data: {key: 'value'}});

          const result = fetchPostAdapter({url: '/test/endpoint', body: {}});
        });

        it('test 2', () => {
          const endpoint = StartEndpointMock.listen({method: 'post', url: '/test/endpoint'});
          endpoint.networkError();

          fetchPostAdapter({url: '/test/endpoint', body: {}});
        });
      `,
      filename: '/project/src/adapters/fetch/post/fetch-post-adapter.test.ts',
    },

    // Harness inside describe.each() in integration test - ALLOWED
    {
      code: `
        describe.each([['a'], ['b']])('case %s', () => {
          const harness = questHarness();

          it('should work', () => {
            harness.create({ guildId: '123' });
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Harness inside nested describe.each in integration test - ALLOWED
    {
      code: `
        describe('outer', () => {
          describe.each([['a'], ['b']])('case %s', () => {
            const harness = questHarness();

            it('should work', () => {
              harness.create({ guildId: '123' });
            });
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
    },

    // Startup integration test importing proxy - ALLOWED because startup files
    // require integration tests (not unit tests) and must use proxies for test harness
    {
      code: `
        import { StartServerProxy } from './start-server.proxy';

        it('should complete flow', () => {
          const proxy = StartServerProxy();
          proxy.request('/api/health');
        });
      `,
      filename: '/project/src/startup/start-server.integration.test.ts',
    },

    // Harness wrapped with wireHarnessLifecycle inside describe in .spec.ts - ALLOWED
    {
      code: `
        describe('GuildDisplay', () => {
          const guilds = wireHarnessLifecycle({ harness: guildHarness(), testObj: test });

          test('should display guilds', () => {
            guilds.create({ name: 'Test' });
          });
        });
      `,
      filename: '/project/src/tests/guilds.spec.ts',
    },
  ],
  invalid: [
    // Module-level proxy creation in test file
    {
      code: `
        const userBrokerProxy = userBrokerProxy();

        it('test 1', () => {
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBrokerProxy', proxyFunction: 'userBrokerProxy' },
        },
      ],
    },

    // Module-level proxy with multiple tests (shared state)
    {
      code: `
        const userBrokerProxy = userBrokerProxy();

        it('test 1', () => {
          userBrokerProxy.setupUser({ userId, user });
        });

        it('test 2', () => {
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBrokerProxy', proxyFunction: 'userBrokerProxy' },
        },
      ],
    },

    // Multiple module-level proxies
    {
      code: `
        const userBrokerProxy = userBrokerProxy();
        const httpAdapterProxy = httpAdapterProxy();

        it('should work', () => {
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/create/user-create-broker.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBrokerProxy', proxyFunction: 'userBrokerProxy' },
        },
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'httpAdapterProxy', proxyFunction: 'httpAdapterProxy' },
        },
      ],
    },

    // Exported proxy instance
    {
      code: `
        export const userBrokerProxy = userBrokerProxy();
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noExportProxy',
        },
      ],
    },

    // Exported proxy with other exports
    {
      code: `
        export const userId = '123';
        export const userBrokerProxy = userBrokerProxy();
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noExportProxy',
        },
      ],
    },

    // Proxy import in .spec.ts file - FORBIDDEN (spec files are e2e-like, no proxies)
    {
      code: `
        import { apiProxy } from './api-broker.proxy';

        it('should call api', () => {
          apiProxy();
        });
      `,
      filename: '/project/src/brokers/api/api-broker.spec.ts',
      errors: [
        {
          messageId: 'noProxyInIntegrationTest',
          data: { importSource: './api-broker.proxy' },
        },
      ],
    },

    // Module-level proxy in TSX test file
    {
      code: `
        const userBindingProxy = userBindingProxy();

        it('should render', () => {
          userBindingProxy.returnsUser({ user });
        });
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBindingProxy', proxyFunction: 'userBindingProxy' },
        },
      ],
    },

    // Integration test importing proxy file - FORBIDDEN
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';

        it('should complete flow', () => {
          userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'noProxyInIntegrationTest',
          data: { importSource: './user-broker.proxy' },
        },
      ],
    },

    // E2E test importing proxy file - FORBIDDEN
    {
      code: `
        import { loginProxy } from './login.proxy';

        it('should complete flow', () => {
          loginProxy();
        });
      `,
      filename: '/project/src/tests/login.e2e.test.ts',
      errors: [
        {
          messageId: 'noProxyInIntegrationTest',
          data: { importSource: './login.proxy' },
        },
      ],
    },

    // Unit test importing harness file - FORBIDDEN
    {
      code: `
        import { questHarness } from '../../test/harnesses/quest/quest.harness';

        it('should not use harness', () => {
          const harness = questHarness();
        });
      `,
      filename: '/project/src/brokers/quest/quest-broker.test.ts',
      errors: [
        {
          messageId: 'noHarnessInUnitTest',
          data: { importSource: '../../test/harnesses/quest/quest.harness' },
        },
      ],
    },

    // Unit test importing harness via .harness.ts extension - FORBIDDEN
    {
      code: `
        import { guildHarness } from '../test/harnesses/guild/guild.harness.ts';

        it('test', () => {
          guildHarness();
        });
      `,
      filename: '/project/src/brokers/guild/guild-broker.test.ts',
      errors: [
        {
          messageId: 'noHarnessInUnitTest',
          data: { importSource: '../test/harnesses/guild/guild.harness.ts' },
        },
      ],
    },

    // Combined violations: module-level AND exported
    {
      code: `
        export const userBrokerProxy = userBrokerProxy();

        it('test', () => {
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'noExportProxy',
        },
      ],
    },

    // Test calls implementation without creating proxy first
    {
      code: `
        it('test', () => {
          const result = userBroker();
          expect(result).toBeDefined();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyNotCreated',
          data: { implementationName: 'userBroker', proxyName: 'userBrokerProxy' },
        },
      ],
    },

    // Test imports proxy but doesn't create it before calling implementation
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';

        it('test', () => {
          const result = userBroker();
          expect(result).toBeDefined();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyNotCreated',
          data: { implementationName: 'userBroker', proxyName: 'userBrokerProxy' },
        },
      ],
    },

    // Proxy created in beforeEach (NOT allowed - must be in it/test block)
    {
      code: `
        beforeEach(() => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });

        it('test 1', () => {
          const result = userBroker();
          expect(result).toBeDefined();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBrokerProxy', proxyFunction: 'userBrokerProxy' },
        },
        {
          messageId: 'proxyNotCreated',
          data: { implementationName: 'userBroker', proxyName: 'userBrokerProxy' },
        },
      ],
    },

    // Proxy created in beforeEach inside describe block
    {
      code: `
        describe('userBroker', () => {
          beforeEach(() => {
            const brokerProxy = userBrokerProxy();
            brokerProxy.setupUser({ userId, user });
          });

          it('test 1', () => {
            const result = userBroker();
            expect(result).toBeDefined();
          });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'brokerProxy', proxyFunction: 'userBrokerProxy' },
        },
        {
          messageId: 'proxyNotCreated',
          data: { implementationName: 'userBroker', proxyName: 'userBrokerProxy' },
        },
      ],
    },

    // Test calls layer broker without creating proxy first
    {
      code: `
        it('test', () => {
          validateAdapterMockSetupLayerBroker(functionNode, mockContext);
        });
      `,
      filename:
        '/project/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.test.ts',
      errors: [
        {
          messageId: 'proxyNotCreated',
          data: {
            implementationName: 'validateAdapterMockSetupLayerBroker',
            proxyName: 'validateAdapterMockSetupLayerBrokerProxy',
          },
        },
      ],
    },

    // Test calls layer broker multiple times without proxy
    {
      code: `
        it('test 1', () => {
          validateAdapterMockSetupLayerBroker(functionNode, mockContext);
        });

        it('test 2', () => {
          validateAdapterMockSetupLayerBroker(functionNode, mockContext);
        });
      `,
      filename:
        '/project/src/brokers/rule/enforce-proxy-patterns/validate-adapter-mock-setup-layer-broker.test.ts',
      errors: [
        {
          messageId: 'proxyNotCreated',
          data: {
            implementationName: 'validateAdapterMockSetupLayerBroker',
            proxyName: 'validateAdapterMockSetupLayerBrokerProxy',
          },
        },
        {
          messageId: 'proxyNotCreated',
          data: {
            implementationName: 'validateAdapterMockSetupLayerBroker',
            proxyName: 'validateAdapterMockSetupLayerBrokerProxy',
          },
        },
      ],
    },

    // Test with describe block calling layer broker without proxy
    {
      code: `
        describe('validateAdapterMockSetupLayerBroker', () => {
          it('should validate mocks', () => {
            validateAdapterMockSetupLayerBroker(functionNode, mockContext);
            expect(mockContext.report).toHaveBeenCalled();
          });
        });
      `,
      filename: '/project/src/brokers/validate-adapter-mock-setup-layer-broker.test.ts',
      errors: [
        {
          messageId: 'proxyNotCreated',
          data: {
            implementationName: 'validateAdapterMockSetupLayerBroker',
            proxyName: 'validateAdapterMockSetupLayerBrokerProxy',
          },
        },
      ],
    },

    // Harness at module level in integration test - FORBIDDEN
    {
      code: `
        const queue = orchestrationQueueHarness();

        describe('OrchestrationFlow', () => {
          it('should work', () => {});
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'queue' },
        },
      ],
    },

    // Harness inside it() block in integration test - FORBIDDEN
    {
      code: `
        describe('OrchestrationFlow', () => {
          it('should work', () => {
            const harness = questHarness();
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'harness' },
        },
      ],
    },

    // Harness inside test() block in integration test - FORBIDDEN
    {
      code: `
        describe('OrchestrationFlow', () => {
          test('should work', () => {
            const harness = questHarness();
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'harness' },
        },
      ],
    },

    // Multiple harnesses at module level - multiple errors
    {
      code: `
        const queue = orchestrationQueueHarness();
        const env = orchestrationEnvironmentHarness();

        describe('test', () => {
          it('test', () => {});
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'queue' },
        },
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'env' },
        },
      ],
    },

    // Bare fooHarness() at module level - FORBIDDEN
    {
      code: `
        orchestrationQueueHarness();

        describe('test', () => {
          it('test', () => {});
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'orchestrationQueueHarness' },
        },
      ],
    },

    // Harness inside it.each() in integration test - FORBIDDEN (inside test block)
    {
      code: `
        describe('test', () => {
          it.each([['a'], ['b']])('case %s', () => {
            const harness = questHarness();
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'harness' },
        },
      ],
    },

    // Bare fooHarness() inside it() - FORBIDDEN
    {
      code: `
        describe('test', () => {
          it('test', () => {
            orchestrationQueueHarness();
          });
        });
      `,
      filename: '/project/src/flows/orchestration/orchestration-flow.integration.test.ts',
      errors: [
        {
          messageId: 'harnessMustBeInDescribe',
          data: { name: 'orchestrationQueueHarness' },
        },
      ],
    },

    // Bare harness call inside describe in .spec.ts - needs wireHarnessLifecycle
    {
      code: `
        describe('GuildDisplay', () => {
          const guilds = guildHarness();

          test('should display guilds', () => {
            guilds.create({ name: 'Test' });
          });
        });
      `,
      filename: '/project/src/tests/guilds.spec.ts',
      errors: [
        {
          messageId: 'harnessNeedsWireInSpec',
          data: { name: 'guilds' },
        },
      ],
    },
  ],
});
