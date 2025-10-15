import { createEslintRuleTester } from '../../../../test/helpers/eslint-rule-tester';
import { enforceProxyPatternsRuleBroker } from './enforce-proxy-patterns-rule-broker';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

const ruleTester = createEslintRuleTester();

beforeEach(() => {
  const adapterProxy = fsExistsSyncAdapterProxy();

  adapterProxy.setupFileSystem((filePath) => {
    const existingFiles = [
      '/project/src/adapters/http/http-adapter.ts',
      '/project/src/brokers/user/fetch/user-fetch-broker.ts',
      '/project/src/state/cache/cache-state.ts',
      '/project/src/adapters/fs/fs-adapter.ts',
      '/project/src/brokers/user/user-broker.ts',
      '/project/src/adapters/db/db-adapter.ts',
      '/project/src/adapters/email/email-adapter.ts',
      '/project/src/adapters/api/api-adapter.ts',
      '/project/src/brokers/env/env-broker.ts',
    ];
    return existingFiles.includes(String(filePath));
  });
});

ruleTester.run('enforce-proxy-patterns', enforceProxyPatternsRuleBroker(), {
  valid: [
    // ✅ CORRECT - Proxy returns object with methods
    {
      code: `export const fooProxy = () => ({ setup: () => {}, returns: () => {} });`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - Proxy returns object with block statement
    {
      code: `
        export const fooProxy = () => {
          return {
            setup: () => {},
            returns: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },
    // ✅ CORRECT - jest.mock() at module level
    {
      code: `
        jest.mock('axios');
        export const fooProxy = () => ({ returns: () => {} });
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - Multiple jest.mock() at module level
    {
      code: `
        jest.mock('axios');
        jest.mock('fs/promises');
        export const fooProxy = () => ({ returns: () => {} });
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - No bootstrap method
    {
      code: `
        export const fooProxy = () => ({
          setup: () => {},
          returns: () => {},
          initialize: () => {}
        });
      `,
      filename: '/project/src/state/cache/cache-state.proxy.ts',
    },
    // Skip non-proxy files
    {
      code: `
        export const foo = () => {
          jest.mock('axios');
          return 'string';
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.ts',
    },
    // ✅ CORRECT - Complex proxy with child proxy creation
    {
      code: `
        import { httpAdapterProxy } from '../../../adapters/http/http-adapter.proxy';

        jest.mock('../../../adapters/http/http-adapter');

        export const userFetchBrokerProxy = () => {
          const http = httpAdapterProxy();

          return {
            setupSuccess: () => {
              http.returns({ status: 200 });
            },
            setupError: () => {
              http.throws(new Error('Failed'));
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
    },
    // ✅ CORRECT - jest.mocked() with npm package
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          mock.mockImplementation(async () => ({ data: {}, status: 200 }));
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - jest.mocked() with npm package (named import)
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mock = jest.mocked(readFile);
          mock.mockResolvedValue(Buffer.from(''));
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },
    // ✅ CORRECT - Adapter proxy with mockImplementation in constructor
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);
          mock.mockImplementation(async () => ({ data: {}, status: 200 }));

          return {
            returns: ({ url, response }) => {
              mock.mockResolvedValueOnce(response);
            }
          };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - Adapter proxy with mockResolvedValue in constructor
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mock = jest.mocked(readFile);
          mock.mockResolvedValue(Buffer.from('default'));

          return {
            returns: ({ path, contents }) => {
              mock.mockResolvedValueOnce(contents);
            }
          };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },
    // ✅ CORRECT - Child proxy created in constructor (before return)
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
    // ✅ CORRECT - Multiple child proxies in constructor
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const dbProxy = dbAdapterProxy();

          return {
            setup: () => {
              httpProxy.returns({ data: {} });
              dbProxy.returns({ rows: [] });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Importing from stub files
    {
      code: `
        import { UserStub } from '../../contracts/user/user.stub';
        import { UserIdStub } from '../../contracts/user-id/user-id.stub';

        export const userBrokerProxy = () => {
          return {
            setup: () => {
              const user = UserStub({ id: UserIdStub('123') });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Importing type from contract is okay (TypeScript types)
    {
      code: `
        import type { User } from '../../contracts/user/user-contract';
        import { UserStub } from '../../contracts/user/user.stub';

        export const userBrokerProxy = () => {
          return {
            setup: ({user}: {user: User}) => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy helpers using "returns" and "throws"
    {
      code: `
        export const fsAdapterProxy = () => ({
          returns: ({ filePath, contents }) => {},
          throws: ({ filePath, error }) => {}
        });
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
    },
    // ✅ CORRECT - Proxy helpers with descriptive action names
    {
      code: `
        export const httpAdapterProxy = () => ({
          setupSuccessResponse: ({ url, data }) => {},
          setupErrorResponse: ({ url, error }) => {},
          setupTimeoutResponse: ({ url }) => {}
        });
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
    },
    // ✅ CORRECT - Proxy helper with action-oriented name
    {
      code: `
        export const userBrokerProxy = () => ({
          setupUserFetch: ({ userId, user }) => {},
          setupUserCreate: ({ userData, user }) => {}
        });
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Child proxy creation and jest.mocked (no side effects)
    {
      code: `
        import axios from 'axios';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        jest.mock('axios');

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          const mock = jest.mocked(axios);
          mock.mockImplementation(async () => ({ data: {}, status: 200 }));

          return {
            setupUser: () => {
              httpProxy.returns({ data: {} });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - jest.spyOn for global functions (allowed)
    {
      code: `
        export const userBrokerProxy = () => {
          jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
          jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-123');

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
  ],
  invalid: [
    // ❌ WRONG - Proxy returns void
    {
      code: `
        export const fooProxy = () => {
          console.log('setup');
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy returns string
    {
      code: `export const fooProxy = () => 'string';`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy returns number
    {
      code: `export const fooProxy = () => 42;`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy returns array
    {
      code: `export const fooProxy = () => [];`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy returns array with items
    {
      code: `export const fooProxy = () => [{ method: () => {} }];`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy with void return type annotation
    {
      code: `export const fooProxy = (): void => { console.log('test'); };`,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy with string return type annotation
    {
      code: `export const fooProxy = (): string => { return 'test'; };`,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy with array return type annotation
    {
      code: `export const fooProxy = (): string[] => { return ['test']; };`,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Proxy has bootstrap method
    {
      code: `
        export const fooProxy = () => ({
          bootstrap: () => {},
          setup: () => {}
        });
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'proxyNoBootstrapMethod' }],
    },
    // ❌ WRONG - Proxy has bootstrap property (not method)
    {
      code: `
        export const fooProxy = () => {
          return {
            bootstrap: 'value',
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/fetch/user-fetch-broker.proxy.ts',
      errors: [{ messageId: 'proxyNoBootstrapMethod' }],
    },
    // ❌ WRONG - jest.mock() inside function
    {
      code: `
        export const fooProxy = () => {
          jest.mock('axios');
          return { setup: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'jestMockMustBeModuleLevel' }],
    },
    // ❌ WRONG - jest.mock() inside nested function
    {
      code: `
        export const fooProxy = () => {
          const setup = () => {
            jest.mock('axios');
          };
          return { setup };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'jestMockMustBeModuleLevel' }],
    },
    // ❌ WRONG - Multiple violations
    {
      code: `
        export const fooProxy = () => {
          jest.mock('axios');
          return {
            bootstrap: () => {},
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'jestMockMustBeModuleLevel' }, { messageId: 'proxyNoBootstrapMethod' }],
    },
    // ❌ WRONG - Empty return (void)
    {
      code: `
        export const fooProxy = () => {
          return;
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - Returning variable that might be primitive
    {
      code: `
        export const fooProxy = () => {
          const result = 'test';
          return result;
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'proxyMustReturnObject' }],
    },
    // ❌ WRONG - jest.mocked() on implementation code (adapter)
    {
      code: `
        import { httpAdapter } from './http-adapter';
        jest.mock('./http-adapter');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(httpAdapter);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [
        { messageId: 'adapterProxyMustSetupMocks' },
        { messageId: 'jestMockedOnlyNpmPackages', data: { name: 'httpAdapter' } },
      ],
    },
    // ❌ WRONG - jest.mocked() on implementation code (broker)
    {
      code: `
        import { userBroker } from '../../brokers/user/user-broker';
        jest.mock('../../brokers/user/user-broker');

        export const userBrokerProxy = () => {
          const mock = jest.mocked(userBroker);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [{ messageId: 'jestMockedOnlyNpmPackages', data: { name: 'userBroker' } }],
    },
    // ❌ WRONG - jest.mocked() on implementation code (transformer)
    {
      code: `
        import { userTransformer } from './user-transformer';
        jest.mock('./user-transformer');

        export const userTransformerProxy = () => {
          const mock = jest.mocked(userTransformer);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/transformers/user/user-transformer.proxy.ts',
      errors: [
        {
          messageId: 'proxyNotColocated',
          data: { expectedPath: '/project/src/transformers/user/user-transformer.ts' },
        },
        { messageId: 'jestMockedOnlyNpmPackages', data: { name: 'userTransformer' } },
      ],
    },
    // ❌ WRONG - jest.mocked() on implementation code (widget)
    {
      code: `
        import { UserWidget } from './user-widget';
        jest.mock('./user-widget');

        export const userWidgetProxy = () => {
          const mock = jest.mocked(UserWidget);
          return { returns: () => {} };
        };
      `,
      filename: '/project/src/widgets/user/user-widget.proxy.ts',
      errors: [
        {
          messageId: 'proxyNotColocated',
          data: { expectedPath: '/project/src/widgets/user/user-widget.ts' },
        },
        { messageId: 'jestMockedOnlyNpmPackages', data: { name: 'UserWidget' } },
      ],
    },
    // ❌ WRONG - Adapter proxy missing mock setup in constructor
    {
      code: `
        import axios from 'axios';
        jest.mock('axios');

        export const httpAdapterProxy = () => {
          const mock = jest.mocked(axios);

          return {
            returns: ({ url, response }) => {
              mock.mockResolvedValueOnce(response);
            }
          };
        };
      `,
      filename: '/project/src/adapters/http/http-adapter.proxy.ts',
      errors: [{ messageId: 'adapterProxyMustSetupMocks' }],
    },
    // ❌ WRONG - Adapter proxy with mock setup inside method (not constructor)
    {
      code: `
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');

        export const fsAdapterProxy = () => {
          const mock = jest.mocked(readFile);

          return {
            setup: () => {
              mock.mockResolvedValue(Buffer.from(''));
            },
            returns: ({ path, contents }) => {
              mock.mockResolvedValueOnce(contents);
            }
          };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [{ messageId: 'adapterProxyMustSetupMocks' }],
    },
    // ❌ WRONG - Child proxy created at module level
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        const httpProxy = httpAdapterProxy();

        export const userBrokerProxy = () => {
          return {
            setup: () => {
              httpProxy.returns({ data: {} });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'childProxyMustBeInsideFunction',
          data: { proxyName: 'httpAdapterProxy' },
        },
      ],
    },
    // ❌ WRONG - Child proxy created inside method (after return)
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
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'childProxyMustBeInConstructor',
          data: { proxyName: 'httpAdapterProxy' },
        },
      ],
    },
    // ❌ WRONG - Child proxy created inside multiple methods
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const userBrokerProxy = () => {
          return {
            setupSuccess: () => {
              const httpProxy = httpAdapterProxy();
              httpProxy.returns({ data: {} });
            },
            setupError: () => {
              const httpProxy = httpAdapterProxy();
              httpProxy.throws(new Error('failed'));
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'childProxyMustBeInConstructor',
          data: { proxyName: 'httpAdapterProxy' },
        },
        {
          messageId: 'childProxyMustBeInConstructor',
          data: { proxyName: 'httpAdapterProxy' },
        },
      ],
    },
    // ❌ WRONG - Mix of correct and incorrect child proxy locations
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';
        import { dbAdapterProxy } from '../../adapters/db/db-adapter.proxy';

        const dbProxy = dbAdapterProxy();

        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {
              httpProxy.returns({ data: {} });
              dbProxy.returns({ rows: [] });
            }
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'childProxyMustBeInsideFunction',
          data: { proxyName: 'dbAdapterProxy' },
        },
      ],
    },
    // ❌ WRONG - Importing from contract file instead of stub
    {
      code: `
        import { userContract } from '../../contracts/user/user-contract';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyNoContractImports',
          data: { importPath: '../../contracts/user/user-contract' },
        },
      ],
    },
    // ❌ WRONG - Importing validator from contract file
    {
      code: `
        import { validateUser } from '../../contracts/user/user-contract';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyNoContractImports',
          data: { importPath: '../../contracts/user/user-contract' },
        },
      ],
    },
    // ❌ WRONG - Forbidden words with various casings and positions
    ...['mock', 'stub', 'fake', 'spy', 'jest', 'dummy'].flatMap((word) => {
      return [
        // Lowercase prefix
        {
          code: `
          export const fsAdapterProxy = () => ({
            ${word}Success: ({ filePath, contents }) => {},
            ${word}Error: ({ filePath, error }) => {}
          });
        `,
          filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
          errors: [
            {
              messageId: 'proxyHelperNoMockInName',
              data: { name: `${word}Success`, forbiddenWord: word },
            },
            {
              messageId: 'proxyHelperNoMockInName',
              data: { name: `${word}Error`, forbiddenWord: word },
            },
          ],
        },
        // Capitalized in middle
        {
          code: `
          export const httpAdapterProxy = () => ({
            setup${word.charAt(0).toUpperCase() + word.slice(1)}Response: ({ url, data }) => {}
          });
        `,
          filename: '/project/src/adapters/http/http-adapter.proxy.ts',
          errors: [
            {
              messageId: 'proxyHelperNoMockInName',
              data: {
                name: `setup${word.charAt(0).toUpperCase() + word.slice(1)}Response`,
                forbiddenWord: word,
              },
            },
          ],
        },
        // ALL CAPS
        {
          code: `
          export const dbAdapterProxy = () => ({
            setup${word.toUpperCase()}Data: ({ query, data }) => {}
          });
        `,
          filename: '/project/src/adapters/db/db-adapter.proxy.ts',
          errors: [
            {
              messageId: 'proxyHelperNoMockInName',
              data: { name: `setup${word.toUpperCase()}Data`, forbiddenWord: word },
            },
          ],
        },
        // Past tense (for words that make sense)
        ...(word === 'mock'
          ? [
              {
                code: `
          export const emailAdapterProxy = () => ({
            mocked: () => {},
            ${word}ed: () => {}
          });
        `,
                filename: '/project/src/adapters/email/email-adapter.proxy.ts',
                errors: [
                  {
                    messageId: 'proxyHelperNoMockInName',
                    data: { name: 'mocked', forbiddenWord: word },
                  },
                  {
                    messageId: 'proxyHelperNoMockInName',
                    data: { name: `${word}ed`, forbiddenWord: word },
                  },
                ],
              },
            ]
          : []),
        // Plural form
        {
          code: `
          export const stateProxy = () => ({
            clear${word.charAt(0).toUpperCase() + word.slice(1)}s: () => {}
          });
        `,
          filename: '/project/src/state/cache/cache-state.proxy.ts',
          errors: [
            {
              messageId: 'proxyHelperNoMockInName',
              data: {
                name: `clear${word.charAt(0).toUpperCase() + word.slice(1)}s`,
                forbiddenWord: word,
              },
            },
          ],
        },
      ];
    }),
    // ❌ WRONG - Multiple forbidden words in one proxy
    {
      code: `
        export const userBrokerProxy = () => ({
          mockUser: () => {},
          stubData: () => {},
          fakeResponse: () => {},
          spyOnCalls: () => {},
          jestSetup: () => {},
          dummyData: () => {}
        });
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        { messageId: 'proxyHelperNoMockInName', data: { name: 'mockUser', forbiddenWord: 'mock' } },
        { messageId: 'proxyHelperNoMockInName', data: { name: 'stubData', forbiddenWord: 'stub' } },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'fakeResponse', forbiddenWord: 'fake' },
        },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'spyOnCalls', forbiddenWord: 'spy' },
        },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'jestSetup', forbiddenWord: 'jest' },
        },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'dummyData', forbiddenWord: 'dummy' },
        },
      ],
    },
    // ❌ WRONG - Compound word containing forbidden word
    {
      code: `
        export const apiAdapterProxy = () => ({
          unmocked: () => {},
          restubbed: () => {},
          defaked: () => {},
          preJest: () => {},
          dummyValue: () => {}
        });
      `,
      filename: '/project/src/adapters/api/api-adapter.proxy.ts',
      errors: [
        { messageId: 'proxyHelperNoMockInName', data: { name: 'unmocked', forbiddenWord: 'mock' } },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'restubbed', forbiddenWord: 'stub' },
        },
        { messageId: 'proxyHelperNoMockInName', data: { name: 'defaked', forbiddenWord: 'fake' } },
        { messageId: 'proxyHelperNoMockInName', data: { name: 'preJest', forbiddenWord: 'jest' } },
        {
          messageId: 'proxyHelperNoMockInName',
          data: { name: 'dummyValue', forbiddenWord: 'dummy' },
        },
      ],
    },
    // ❌ WRONG - fs operations in constructor (side effects)
    {
      code: `
        import fs from 'fs';
        import { readFileSync } from 'fs';
        jest.mock('fs');
        export const fsAdapterProxy = () => {
          const mock = jest.mocked(readFileSync);
          mock.mockReturnValue(Buffer.from(''));
          fs.mkdirSync('/tmp/test');
          fs.writeFileSync('/tmp/test/file.txt', 'data');

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'fs.mkdirSync()' },
        },
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'fs.writeFileSync()' },
        },
      ],
    },
    // ❌ WRONG - console.log in constructor (side effect)
    {
      code: `
        export const userBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();
          console.log('Setting up proxy');

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'console.log()' },
        },
      ],
    },
    // ❌ WRONG - database operations in constructor (side effects)
    {
      code: `
        export const userBrokerProxy = () => {
          db.query('CREATE TABLE users');
          database.connect();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'db.query()' },
        },
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'database.connect()' },
        },
      ],
    },
    // ❌ WRONG - Multiple side effects in constructor
    {
      code: `
        import fs from 'fs';
        import { readFile } from 'fs/promises';
        jest.mock('fs/promises');
        export const fsAdapterProxy = () => {
          const mock = jest.mocked(readFile);
          mock.mockResolvedValue(Buffer.from(''));
          fs.mkdirSync('/tmp');
          console.log('Created directory');
          db.query('SELECT * FROM files');

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/adapters/fs/fs-adapter.proxy.ts',
      errors: [
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'fs.mkdirSync()' },
        },
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'console.log()' },
        },
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'db.query()' },
        },
      ],
    },
    // ❌ WRONG - process operations in constructor
    {
      code: `
        export const envBrokerProxy = () => {
          process.exit(1);

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/env/env-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyConstructorNoSideEffects',
          data: { type: 'process.exit()' },
        },
      ],
    },
    // ❌ WRONG - Broker proxy without colocated implementation
    {
      code: `
        export const orphanBrokerProxy = () => ({
          setup: () => {}
        });
      `,
      filename: '/project/src/brokers/orphan/orphan-broker.proxy.ts',
      errors: [
        {
          messageId: 'proxyNotColocated',
          data: { expectedPath: '/project/src/brokers/orphan/orphan-broker.ts' },
        },
      ],
    },
    // ❌ WRONG - State proxy in wrong directory
    {
      code: `
        export const lostStateProxy = () => ({
          setup: () => {}
        });
      `,
      filename: '/project/src/state/lost/lost-state.proxy.ts',
      errors: [
        {
          messageId: 'proxyNotColocated',
          data: { expectedPath: '/project/src/state/lost/lost-state.ts' },
        },
      ],
    },
    // ❌ WRONG - Transformer proxy without implementation
    {
      code: `
        export const missingTransformerProxy = () => ({
          setup: () => {}
        });
      `,
      filename: '/project/src/transformers/missing/missing-transformer.proxy.ts',
      errors: [
        {
          messageId: 'proxyNotColocated',
          data: { expectedPath: '/project/src/transformers/missing/missing-transformer.ts' },
        },
      ],
    },
  ],
});
