import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceProxyChildCreationRuleBroker } from './enforce-proxy-child-creation-rule-broker';
import { fsExistsSyncAdapter } from '../../../adapters/fs/fs-exists-sync-adapter';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/fs-read-file-sync/fs-read-file-sync-adapter';

jest.mock('../../../adapters/fs/fs-exists-sync-adapter');
jest.mock('../../../adapters/fs/fs-read-file-sync/fs-read-file-sync-adapter');

const mockFsExistsSync = jest.mocked(fsExistsSyncAdapter);
const mockFsReadFileSync = jest.mocked(fsReadFileSyncAdapter);

const ruleTester = createEslintRuleTester();

beforeEach(() => {
  mockFsExistsSync.mockReset();
  mockFsReadFileSync.mockReset();

  // Set up file system mocks based on filename
  mockFsExistsSync.mockImplementation(({ filePath }: { filePath: string }) => {
    const path = String(filePath);

    // No implementation file for foo.proxy.ts
    if (path.includes('foo.proxy.ts')) {
      return false;
    }

    // All other .ts files exist
    return path.endsWith('.ts');
  });

  mockFsReadFileSync.mockImplementation(({ filePath }: { filePath: string; encoding?: string }) => {
    const path = String(filePath);

    // All broker files that import httpAdapter only
    if (
      path.includes('brokers/user/user-broker.ts') ||
      path.includes('brokers/user/no-creation-broker.ts') ||
      path.includes('brokers/user/after-return-broker.ts') ||
      path.includes('brokers/user/phantom-proxy-broker.ts')
    ) {
      return `
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const userBroker = () => {
          return httpAdapter.get();
        };
      `;
    }

    // Empty broker with no imports
    if (path.includes('brokers/empty/empty-broker.ts')) {
      return `
        export const emptyBroker = () => {
          return { data: 'test' };
        };
      `;
    }

    // user-broker.ts with multiple adapters
    if (
      path.includes('brokers/user-multi/user-broker.ts') ||
      path.includes('brokers/user-multi/missing-db-broker.ts') ||
      path.includes('brokers/user-multi/no-proxies-broker.ts')
    ) {
      return `
        import { httpAdapter } from '../../adapters/http/http-adapter';
        import { dbAdapter } from '../../adapters/db/db-adapter';

        export const userBroker = () => {
          const http = httpAdapter.get();
          const db = dbAdapter.query();
          return { http, db };
        };
      `;
    }

    // user-transformer.ts - no dependencies
    if (path.includes('transformers/user/user-transformer.ts')) {
      return `
        export const userTransformer = (data: unknown) => {
          return { name: 'John' };
        };
      `;
    }

    // user-guard.ts - only contracts
    if (path.includes('guards/user/user-guard.ts')) {
      return `
        import type { User } from '../../contracts/user/user-contract';

        export const userGuard = (user: User): boolean => {
          return user.isActive;
        };
      `;
    }

    // http-adapter.ts - only npm packages
    if (path.includes('adapters/http/http-adapter.ts')) {
      return `
        import axios from 'axios';

        export const httpAdapter = {
          get: async () => axios.get('/api')
        };
      `;
    }

    // Default empty implementation
    return `export const placeholder = () => {};`;
  });
});

ruleTester.run('enforce-proxy-child-creation', enforceProxyChildCreationRuleBroker(), {
  valid: [
    // ✅ CORRECT - Proxy imports and creates child proxy
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {
              httpProxy.returns({ data: {} });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Multiple child proxies
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const dbProxy = dbAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-multi/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Implementation has no dependencies
    {
      code: `
        export const userTransformerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/transformers/user/user-transformer.proxy.ts',
    },
    // ✅ CORRECT - Implementation only imports contracts (no proxies needed)
    {
      code: `
        import { UserStub } from '../../contracts/user/user.stub';

        export const userGuardProxy = () => {
          return {
            setupValidUser: () => UserStub({ isActive: true })
          };
        };
      `,
      filename: '/project/src/guards/user/user-guard.proxy.ts',
    },
    // ✅ CORRECT - Implementation only imports npm packages (no proxies needed)
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          mock.mockImplementation(async () => ({ data: {} }));

          return {
            returns: () => {}
          };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - No implementation file (skip validation)
    {
      code: `
        export const fooProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/test/foo.proxy.ts',
    },
    // Skip non-proxy files
    {
      code: `
        export const userBroker = () => {
          return { fetch: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.ts',
    },
  ],
  invalid: [
    // ❌ WRONG - Missing proxy import
    {
      code: `
        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'httpAdapter',
            proxyPath: '../../adapters/http/http-adapter.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Has proxy import but missing creation
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/no-creation-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyCreation',
          data: {
            implementationName: 'httpAdapter',
            proxyName: 'httpAdapterProxy',
          },
        },
      ],
    },
    // ❌ WRONG - Proxy created after return (not in constructor)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          return {
            setup: () => {
              const httpProxy = httpAdapterProxy();
              httpProxy.returns({ data: {} });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/after-return-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyCreation',
          data: {
            implementationName: 'httpAdapter',
            proxyName: 'httpAdapterProxy',
          },
        },
      ],
    },
    // ❌ WRONG - One missing proxy (has httpAdapter, missing dbAdapter)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-multi/missing-db-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'dbAdapter',
            proxyPath: '../../adapters/db/db-adapter.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Multiple missing proxies (implementation imports 2, proxy imports 0)
    {
      code: `
        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-multi/no-proxies-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'httpAdapter',
            proxyPath: '../../adapters/http/http-adapter.proxy',
          },
        },
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'dbAdapter',
            proxyPath: '../../adapters/db/db-adapter.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Phantom proxy (proxy creates dbAdapterProxy but impl doesn't use dbAdapter)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const dbProxy = dbAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/phantom-proxy-broker.proxy.ts',
      errors: [
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'dbAdapterProxy',
            implementationFile: 'phantom-proxy-broker.ts',
            implementationName: 'dbAdapter',
          },
        },
      ],
    },
    // ❌ WRONG - Multiple phantom proxies (impl uses nothing, proxy creates 2)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        export const emptyBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const dbProxy = dbAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/empty/empty-broker.proxy.ts',
      errors: [
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'httpAdapterProxy',
            implementationFile: 'empty-broker.ts',
            implementationName: 'httpAdapter',
          },
        },
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'dbAdapterProxy',
            implementationFile: 'empty-broker.ts',
            implementationName: 'dbAdapter',
          },
        },
      ],
    },
  ],
});
