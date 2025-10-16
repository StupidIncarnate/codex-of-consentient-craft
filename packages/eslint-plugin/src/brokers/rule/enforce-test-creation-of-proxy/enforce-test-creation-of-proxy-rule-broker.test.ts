import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { enforceTestCreationOfProxyRuleBroker } from './enforce-test-creation-of-proxy-rule-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-test-creation-of-proxy', enforceTestCreationOfProxyRuleBroker(), {
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

    // Integration test files
    {
      code: `
        it('should complete user flow', () => {
          const userBrokerProxy = userBrokerProxy();
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
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

    // Module-level proxy in integration test file
    {
      code: `
        const userBrokerProxy = userBrokerProxy();

        it('should complete flow', () => {
          userBrokerProxy.setupUser({ userId, user });
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'proxyMustBeInTest',
          data: { name: 'userBrokerProxy', proxyFunction: 'userBrokerProxy' },
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
  ],
});
