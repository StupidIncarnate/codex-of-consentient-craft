import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceTestProxyImportsBroker } from './rule-enforce-test-proxy-imports-broker';

const ruleTester = eslintRuleTesterAdapter();

ruleTester.run('enforce-test-proxy-imports', ruleEnforceTestProxyImportsBroker(), {
  valid: [
    // Colocated proxy import (correct)
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';

        it('should work', () => {
          const proxy = userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Colocated proxy import with .ts extension
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy.ts';

        it('should work', () => {
          const proxy = userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Colocated proxy import in spec file
    {
      code: `
        import { apiProxy } from './api-broker.proxy';

        it('should work', () => {
          const proxy = apiProxy();
        });
      `,
      filename: '/project/src/brokers/api/api-broker.spec.ts',
    },

    // Integration tests with no proxy imports (allowed)
    {
      code: `
        import { User } from './user-contract.stub';

        it('should complete flow', () => {
          // Integration test without proxy
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
    },

    // TSX test file with colocated proxy
    {
      code: `
        import { userCardWidgetProxy } from './user-card-widget.proxy';

        it('should render', () => {
          const proxy = userCardWidgetProxy();
        });
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
    },

    // Non-proxy imports are allowed
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';
        import { User } from './user-contract.stub';
        import { expect } from '@jest/globals';

        it('should work', () => {
          const proxy = userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // No proxy imports is fine
    {
      code: `
        import { User } from './user-contract.stub';

        it('should work', () => {
          expect(true).toBe(true);
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
    },

    // Non-test files can import any proxy
    {
      code: `
        import { userBrokerProxy } from '../user/user-broker.proxy';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
      `,
      filename: '/project/src/utils/test-helpers.ts',
    },

    // Proxy files can import other proxies
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          const http = httpAdapterProxy();
          return { setupUser: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
  ],
  invalid: [
    // Importing non-colocated proxy
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        it('should work', () => {
          const proxy = httpAdapterProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
          data: {
            importPath: '../../adapters/http/http-adapter.proxy',
            colocatedProxyPath: './user-broker.proxy',
          },
        },
      ],
    },

    // Importing sibling proxy
    {
      code: `
        import { userCreateBrokerProxy } from './user-create-broker.proxy';

        it('should work', () => {
          const proxy = userCreateBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-fetch-broker.test.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
          data: {
            importPath: './user-create-broker.proxy',
            colocatedProxyPath: './user-fetch-broker.proxy',
          },
        },
      ],
    },

    // Multiple proxy imports (both non-colocated)
    {
      code: `
        import { userBrokerProxy } from '../user/user-broker.proxy';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        it('should work', () => {
          const userProxy = userBrokerProxy();
          const httpProxy = httpAdapterProxy();
        });
      `,
      filename: '/project/src/brokers/api/api-broker.test.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
        },
        {
          messageId: 'nonColocatedProxyImport',
        },
        {
          messageId: 'multipleProxyImports',
        },
      ],
    },

    // Multiple proxy imports (one colocated, one not)
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        it('should work', () => {
          const userProxy = userBrokerProxy();
          const httpProxy = httpAdapterProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
        },
        {
          messageId: 'multipleProxyImports',
        },
      ],
    },

    // Wrong proxy in spec file
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';

        it('should work', () => {
          const proxy = userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/api/api-broker.spec.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
          data: {
            importPath: './user-broker.proxy',
            colocatedProxyPath: './api-broker.proxy',
          },
        },
      ],
    },

    // Integration test cannot import any proxy (even colocated)
    {
      code: `
        import { userBrokerProxy } from './user-broker.proxy';

        it('should complete flow', () => {
          const proxy = userBrokerProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'integrationTestNoProxy',
          data: {
            importPath: './user-broker.proxy',
          },
        },
      ],
    },

    // Integration test importing non-colocated proxy
    {
      code: `
        import { apiProxy } from '../api/api-broker.proxy';

        it('should complete flow', () => {
          const proxy = apiProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.integration.test.ts',
      errors: [
        {
          messageId: 'integrationTestNoProxy',
          data: {
            importPath: '../api/api-broker.proxy',
          },
        },
      ],
    },

    // Wrong proxy in TSX test
    {
      code: `
        import { userProfileWidgetProxy } from '../user-profile/user-profile-widget.proxy';

        it('should render', () => {
          const proxy = userProfileWidgetProxy();
        });
      `,
      filename: '/project/src/widgets/user-card/user-card-widget.test.tsx',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
          data: {
            importPath: '../user-profile/user-profile-widget.proxy',
            colocatedProxyPath: './user-card-widget.proxy',
          },
        },
      ],
    },

    // Import with .ts extension (still wrong proxy)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy.ts';

        it('should work', () => {
          const proxy = httpAdapterProxy();
        });
      `,
      filename: '/project/src/brokers/user/user-broker.test.ts',
      errors: [
        {
          messageId: 'nonColocatedProxyImport',
          data: {
            importPath: '../../adapters/http/http-adapter.proxy.ts',
            colocatedProxyPath: './user-broker.proxy',
          },
        },
      ],
    },
  ],
});
