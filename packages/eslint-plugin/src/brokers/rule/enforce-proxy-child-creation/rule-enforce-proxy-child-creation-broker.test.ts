import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
import { ruleEnforceProxyChildCreationBroker } from './rule-enforce-proxy-child-creation-broker';
import { ruleEnforceProxyChildCreationBrokerProxy } from './rule-enforce-proxy-child-creation-broker.proxy';
import type { FilePathStub } from '@dungeonmaster/shared/contracts';
import { FileContentsStub } from '@dungeonmaster/shared/contracts';

type FileContents = ReturnType<typeof FileContentsStub>;
type FilePath = ReturnType<typeof FilePathStub>;

const ruleTester = eslintRuleTesterAdapter();

beforeEach(() => {
  const brokerProxy = ruleEnforceProxyChildCreationBrokerProxy();

  // Set up file system mocks based on filename
  brokerProxy.setupFileSystem({
    getContents: (filePath: FilePath): FileContents | null => {
      // No implementation file for foo.proxy.ts - return null
      if (filePath.includes('foo.proxy.ts')) {
        return null;
      }

      // All broker files that import httpAdapter only
      if (
        filePath.includes('brokers/user/user-broker.ts') ||
        filePath.includes('brokers/user/no-creation-broker.ts') ||
        filePath.includes('brokers/user/after-return-broker.ts') ||
        filePath.includes('brokers/user/phantom-proxy-broker.ts')
      ) {
        return FileContentsStub({
          value: `
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const userBroker = () => {
          return httpAdapter.get();
        };
      `,
        });
      }

      // Empty broker with no imports
      if (filePath.includes('brokers/empty/empty-broker.ts')) {
        return FileContentsStub({
          value: `
        export const emptyBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // user-broker.ts with multiple adapters
      if (
        filePath.includes('brokers/user-multi/user-broker.ts') ||
        filePath.includes('brokers/user-multi/missing-db-broker.ts') ||
        filePath.includes('brokers/user-multi/no-proxies-broker.ts')
      ) {
        return FileContentsStub({
          value: `
        import { httpAdapter } from '../../adapters/http/http-adapter';
        import { dbAdapter } from '../../adapters/db/db-adapter';

        export const userBroker = () => {
          const http = httpAdapter.get();
          const db = dbAdapter.query();
          return { http, db };
        };
      `,
        });
      }

      // user-transformer.ts - no dependencies
      if (filePath.includes('transformers/user/user-transformer.ts')) {
        return FileContentsStub({
          value: `
        export const userTransformer = (data: unknown) => {
          return { name: 'John' };
        };
      `,
        });
      }

      // user-guard.ts - only contracts
      if (filePath.includes('guards/user/user-guard.ts')) {
        return FileContentsStub({
          value: `
        import type { User } from '../../contracts/user/user-contract';

        export const userGuard = (user: User): boolean => {
          return user.isActive;
        };
      `,
        });
      }

      // Broker that imports transformer (requireProxy: false)
      if (filePath.includes('brokers/user-with-transformer/user-broker.ts')) {
        return FileContentsStub({
          value: `
        import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Broker that imports guard (requireProxy: false)
      if (filePath.includes('brokers/user-with-guard/user-broker.ts')) {
        return FileContentsStub({
          value: `
        import { hasPermissionGuard } from '../../guards/has-permission/has-permission-guard';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Broker that imports statics (requireProxy: false)
      if (filePath.includes('brokers/user-with-statics/user-broker.ts')) {
        return FileContentsStub({
          value: `
        import { userStatics } from '../../statics/user/user-statics';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Broker that imports error (requireProxy: false)
      if (filePath.includes('brokers/user-with-error/user-broker.ts')) {
        return FileContentsStub({
          value: `
        import { ValidationError } from '../../errors/validation/validation-error';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Broker that imports another broker (requireProxy: true) - same folder type
      if (
        filePath.includes(
          'brokers/user-orchestration/orchestrate/user-orchestration-orchestrate-broker.ts',
        )
      ) {
        return FileContentsStub({
          value: `
        import { userFetchBroker } from '../../user/fetch/user-fetch-broker';
        import { emailSendBroker } from '../../email/send/email-send-broker';

        export const userOrchestrationOrchestrateBroker = () => {
          const user = userFetchBroker();
          emailSendBroker({ to: user.email });
        };
      `,
        });
      }

      // eslint-rule-tester-adapter.ts - has example code in comments
      if (filePath.includes('adapters/eslint/rule-tester/eslint-rule-tester-adapter.ts')) {
        return FileContentsStub({
          value: `
        /**
         * @example
         * \`\`\`typescript
         * import { eslintRuleTesterAdapter } from '../../../adapters/eslint/rule-tester/eslint-rule-tester-adapter';
         * import { myRuleBroker } from './my-rule-broker';
         *
         * const ruleTester = eslintRuleTesterAdapter();
         * \`\`\`
         */
        export const eslintRuleTesterAdapter = (): RuleTester => {
          return new RuleTester();
        };
      `,
        });
      }

      // http-adapter.ts - only npm packages
      if (filePath.includes('adapters/http/http-adapter.ts')) {
        return FileContentsStub({
          value: `
        import axios from 'axios';

        export const httpAdapter = {
          get: async () => axios.get('/api')
        };
      `,
        });
      }

      // test-file-path-variants-transformer.ts - imports statics
      if (
        filePath.includes(
          'transformers/test-file-path-variants/test-file-path-variants-transformer.ts',
        )
      ) {
        return FileContentsStub({
          value: `
        import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

        export const testFilePathVariantsTransformer = ({ sourceFilePath }) => {
          return testFilePatternStatics.suffixes.map((suffix) => \`\${sourceFilePath}\${suffix}\`);
        };
      `,
        });
      }

      // Broker that imports from scoped package with folder type subpath
      if (filePath.includes('brokers/scoped-import/scoped-broker.ts')) {
        return FileContentsStub({
          value: `
        import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const scopedBroker = () => {
          const root = projectRootFindBroker();
          return { root };
        };
      `,
        });
      }

      // Broker that imports only from scoped package (no relative imports)
      if (filePath.includes('brokers/scoped-only/scoped-only-broker.ts')) {
        return FileContentsStub({
          value: `
        import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';

        export const scopedOnlyBroker = () => {
          const root = projectRootFindBroker();
          return { root };
        };
      `,
        });
      }

      // Broker that imports from scoped package with non-proxy folder type
      if (filePath.includes('brokers/scoped-contracts/scoped-contracts-broker.ts')) {
        return FileContentsStub({
          value: `
        import { userContract } from '@dungeonmaster/shared/contracts';
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const scopedContractsBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Broker that imports from different scoped package (@acme/core)
      if (filePath.includes('brokers/acme-import/acme-broker.ts')) {
        return FileContentsStub({
          value: `
        import { userBroker } from '@acme/core/brokers';
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const acmeBroker = () => {
          const user = userBroker();
          return { user };
        };
      `,
        });
      }

      // Broker that imports from different scoped package (@myorg/utils)
      if (filePath.includes('brokers/myorg-import/myorg-broker.ts')) {
        return FileContentsStub({
          value: `
        import { logAdapter } from '@myorg/utils/adapters';

        export const myorgBroker = () => {
          const log = logAdapter();
          return { log };
        };
      `,
        });
      }

      // Broker that imports from different scoped package with non-proxy folder type
      if (filePath.includes('brokers/acme-contracts/acme-contracts-broker.ts')) {
        return FileContentsStub({
          value: `
        import { userContract } from '@acme/core/contracts';
        import { httpAdapter } from '../../adapters/http/http-adapter';

        export const acmeContractsBroker = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // Default empty implementation
      return FileContentsStub({ value: `export const placeholder = () => {};` });
    },
  });
});

ruleTester.run('enforce-proxy-child-creation', ruleEnforceProxyChildCreationBroker(), {
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
    // ✅ CORRECT - Implementation has example imports in comments (should be ignored)
    {
      code: `
        import type { RuleTester } from 'eslint';
        import { eslintRuleTesterAdapter } from './eslint-rule-tester-adapter';

        export const eslintRuleTesterAdapterProxy = (): {
          returnsRuleTester: () => RuleTester;
        } => {
          const ruleTester = eslintRuleTesterAdapter();

          return {
            returnsRuleTester: (): RuleTester => ruleTester,
          };
        };
      `,
      filename: '/project/src/adapters/eslint/rule-tester/eslint-rule-tester-adapter.proxy.ts',
    },
    // ✅ CORRECT - Implementation only imports statics (no proxies needed)
    {
      code: `
        /**
         * Proxy for test-file-path-variants transformer.
         * Empty proxy - transformers are pure functions, no mocking needed.
         */
        export const testFilePathVariantsTransformerProxy = (): Record<PropertyKey, never> => ({});
      `,
      filename:
        '/project/src/transformers/test-file-path-variants/test-file-path-variants-transformer.proxy.ts',
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
    // ✅ CORRECT - Broker proxy importing transformer (transformers don't need proxies per folderConfigStatics)
    {
      code: `
        import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-with-transformer/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Broker proxy importing guard (guards don't need proxies per folderConfigStatics)
    {
      code: `
        import { hasPermissionGuard } from '../../guards/has-permission/has-permission-guard';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-with-guard/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Broker proxy importing statics (statics don't need proxies)
    {
      code: `
        import { userStatics } from '../../statics/user/user-statics';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-with-statics/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Broker proxy importing error (errors don't need proxies per folderConfigStatics)
    {
      code: `
        import { ValidationError } from '../../errors/validation/validation-error';

        export const userBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/user-with-error/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Broker proxy importing other broker proxies (brokers have requireProxy: true)
    {
      code: `
        import { userFetchBrokerProxy } from '../../user/fetch/user-fetch-broker.proxy';
        import { emailSendBrokerProxy } from '../../email/send/email-send-broker.proxy';

        export const userOrchestrationOrchestrateBrokerProxy = () => {
          const userFetchProxy = userFetchBrokerProxy();
          const emailSendProxy = emailSendBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/project/src/brokers/user-orchestration/orchestrate/user-orchestration-orchestrate-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports from scoped package and creates proxy
    {
      code: `
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const scopedBrokerProxy = () => {
          const projectRootProxy = projectRootFindBrokerProxy();
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-import/scoped-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports only from scoped package
    {
      code: `
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/testing';

        export const scopedOnlyBrokerProxy = () => {
          const projectRootProxy = projectRootFindBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-only/scoped-only-broker.proxy.ts',
    },
    // ✅ CORRECT - Implementation imports from scoped package with non-proxy folder type (contracts)
    {
      code: `
        import { userContract } from '@dungeonmaster/shared/contracts';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const scopedContractsBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-contracts/scoped-contracts-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports from different scoped package (@acme/core) and creates proxy
    {
      code: `
        import { userBrokerProxy } from '@acme/core/testing';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const acmeBrokerProxy = () => {
          const userProxy = userBrokerProxy();
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/acme-import/acme-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports only from different scoped package (@myorg/utils)
    {
      code: `
        import { logAdapterProxy } from '@myorg/utils/testing';

        export const myorgBrokerProxy = () => {
          const logProxy = logAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/myorg-import/myorg-broker.proxy.ts',
    },
    // ✅ CORRECT - Implementation imports from different scoped package with non-proxy folder type
    {
      code: `
        import { userContract } from '@acme/core/contracts';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const acmeContractsBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/acme-contracts/acme-contracts-broker.proxy.ts',
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
    // ❌ WRONG - Missing scoped package proxy import
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const scopedBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-import/scoped-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'projectRootFindBroker',
            proxyPath: '@dungeonmaster/shared/testing',
          },
        },
      ],
    },
    // ❌ WRONG - Scoped package proxy imported but not created
    {
      code: `
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const scopedBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-import/scoped-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyCreation',
          data: {
            implementationName: 'projectRootFindBroker',
            proxyName: 'projectRootFindBrokerProxy',
          },
        },
      ],
    },
    // ❌ WRONG - Missing scoped package proxy (implementation imports only scoped package)
    {
      code: `
        export const scopedOnlyBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/scoped-only/scoped-only-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'projectRootFindBroker',
            proxyPath: '@dungeonmaster/shared/testing',
          },
        },
      ],
    },
    // ❌ WRONG - Missing proxy import from different scoped package (@acme/core)
    {
      code: `
        import { httpAdapterProxy } from '../../adapters/http/http-adapter.proxy';

        export const acmeBrokerProxy = () => {
          const httpProxy = httpAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/acme-import/acme-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'userBroker',
            proxyPath: '@acme/core/testing',
          },
        },
      ],
    },
    // ❌ WRONG - Scoped package proxy from @myorg/utils imported but not created
    {
      code: `
        import { logAdapterProxy } from '@myorg/utils/testing';

        export const myorgBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/myorg-import/myorg-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyCreation',
          data: {
            implementationName: 'logAdapter',
            proxyName: 'logAdapterProxy',
          },
        },
      ],
    },
    // ❌ WRONG - Missing scoped package proxy from @acme/core (implementation imports only @acme/core)
    {
      code: `
        export const myorgBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/myorg-import/myorg-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'logAdapter',
            proxyPath: '@myorg/utils/testing',
          },
        },
      ],
    },
  ],
});
