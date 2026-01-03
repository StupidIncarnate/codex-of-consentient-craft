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

    // Module-level proxy in .spec.ts file
    {
      code: `
        const apiProxy = apiProxy();

        it('should call api', () => {
          apiProxy.returnsSuccess();
        });
      `,
      filename: '/project/src/brokers/api/api-broker.spec.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'apiProxy', proxyFunction: 'apiProxy' },
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

    // Integration test with proxy import using .proxy.ts extension - FORBIDDEN
    {
      code: `
        import { StartInstallProxy } from './start-install.proxy';

        it('should complete flow', () => {
          StartInstallProxy();
        });
      `,
      filename: '/project/src/startup/start-install.integration.test.ts',
      errors: [
        {
          messageId: 'noProxyInIntegrationTest',
          data: { importSource: './start-install.proxy' },
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
  ],
});
