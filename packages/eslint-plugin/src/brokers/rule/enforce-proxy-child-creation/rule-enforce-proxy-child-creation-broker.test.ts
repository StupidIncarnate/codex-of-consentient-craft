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

      // agentRoleContract has no colocated proxy on disk — a bare workspace-package-root import
      // of a contract stays a pass-through, exactly like a gateway pass-through does.
      if (filePath.includes('orchestrator/src/contracts/agent-role/agent-role-contract.proxy.ts')) {
        return null;
      }

      // Every package.json probe is answered explicitly, never by the generic placeholder default
      // below (which is not valid JSON and would crash workspaceRootFindBroker's JSON.parse).
      // '/repo' is this repo's own fake workspace root (unscoped name 'dungeonmaster', scope
      // '@dungeonmaster'); '/acme-repo' is a published consumer's own fake workspace root (scoped
      // name '@acme/repo', scope '@acme') — proving the scope is read off the real workspace root's
      // own package.json `name`, never off a dependency list, which a consumer's own
      // `devDependencies` would misreport as '@dungeonmaster' (F13; see
      // '/acme-devdeps-repo/package.json' below for that exact regression). Every OTHER package.json
      // (every intermediate directory the walk climbs past, and every '/project/...' fixture that
      // never exercises a bare-root import) answers "not a workspace root" by returning null, so the
      // walk climbs past it exactly like a real ordinary package.json with no `workspaces` field
      // would.
      if (filePath === '/repo/package.json') {
        return FileContentsStub({
          value: JSON.stringify({
            name: 'dungeonmaster',
            workspaces: ['packages/*'],
          }),
        });
      }
      if (filePath === '/acme-repo/package.json') {
        return FileContentsStub({
          value: JSON.stringify({
            name: '@acme/repo',
            workspaces: ['packages/*'],
          }),
        });
      }
      // F13 regression: a fresh consumer's root `dependencies` holds NOTHING yet (no workspace
      // package has ever been registered there — `create-package`'s "register" step is what adds
      // one, and this repo's own `install-setup-gateway-responder` never touches root `dependencies`
      // either), while `devDependencies` already carries the `@dungeonmaster/*` tooling `dungeonmaster
      // init` installed. The scope must still come out '@acme', from the root `name` alone.
      if (filePath === '/acme-devdeps-repo/package.json') {
        return FileContentsStub({
          value: JSON.stringify({
            name: '@acme/repo',
            workspaces: ['packages/*'],
            devDependencies: { '@dungeonmaster/cli': '*', '@dungeonmaster/testing': '*' },
          }),
        });
      }
      if (filePath.endsWith('/package.json')) {
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

      // Broker that imports a mixed named import: a real value alongside a per-name
      // type-only specifier ('{ walkBroker, type WalkMemo }') — the exact G06 regression
      // case, where WalkMemo must never be treated as a value needing its own proxy.
      if (filePath.includes('brokers/walk-consumer/walk-consumer-broker.ts')) {
        return FileContentsStub({
          value: `
        import { walkBroker, type WalkMemo } from '../../brokers/walk/walk-broker';

        export const walkConsumerBroker = () => {
          return walkBroker();
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

      // Widget implementation that imports layer widgets (tsx)
      if (filePath.includes('widgets/button/button-widget.tsx')) {
        return FileContentsStub({
          value: `
        import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter';

        export const ButtonWidget = () => {
          return inkBoxAdapter();
        };
      `,
        });
      }

      // Broker that imports with .tsx extension in import path
      if (filePath.includes('brokers/tsx-import/tsx-import-broker.ts')) {
        return FileContentsStub({
          value: `
        import { inkBoxAdapter } from '../../adapters/ink/box/ink-box-adapter.tsx';

        export const tsxImportBroker = () => {
          return inkBoxAdapter();
        };
      `,
        });
      }

      // Gateway implementation (node): imports two wrapped fs/promises exports at a deep
      // subpath, reproducing the exact misfire found in the mcp config-create trial unit.
      if (
        filePath.includes('install-config-create-responder.ts') ||
        filePath.includes('install-config-create-no-proxy-responder.ts') ||
        filePath.includes('install-config-create-per-file-responder.ts')
      ) {
        return FileContentsStub({
          value: `
        import { join } from '@dungeonmaster/node/path';
        import { readJsonFileIfExists, writeFile } from '@dungeonmaster/node/fs__promises';

        export const installConfigCreateResponder = async () => {
          const configPath = join('/repo', '.mcp.json');
          const existing = await readJsonFileIfExists(configPath);
          await writeFile(configPath, JSON.stringify(existing));
        };
      `,
        });
      }

      // Gateway implementation (node), imported through the '#gateway/...' import-alias form:
      // same shape as install-config-create-responder.ts above, proving the alias resolves
      // through the identical proxy-child-creation path as the '@dungeonmaster/...' form.
      if (
        filePath.includes('install-config-create-gateway-alias-responder.ts') ||
        filePath.includes('install-config-create-gateway-alias-no-proxy-responder.ts') ||
        filePath.includes('install-config-create-gateway-alias-per-file-responder.ts')
      ) {
        return FileContentsStub({
          value: `
        import { join } from '#gateway/node/path';
        import { readJsonFileIfExists, writeFile } from '#gateway/node/fs__promises';

        export const installConfigCreateGatewayAliasResponder = async () => {
          const configPath = join('/repo', '.mcp.json');
          const existing = await readJsonFileIfExists(configPath);
          await writeFile(configPath, JSON.stringify(existing));
        };
      `,
        });
      }

      // Gateway implementation (npm pass-through): imports zod's own `z`, which is never
      // wrapped, so it needs no proxy at all.
      if (filePath.includes('zod-import-broker.ts')) {
        return FileContentsStub({
          value: `
        import { z } from '@dungeonmaster/npm/zod';

        export const zodImportBroker = () => {
          return z.string();
        };
      `,
        });
      }

      // The node fs__promises subpath's own PRODUCTION barrel: names the wrapper folder behind every
      // WRAPPED export. 'join' from @scope/node/path is never re-exported from a local wrapper folder
      // here — path does no I/O and is a pure pass-through — unlike fs__promises's
      // readJsonFileIfExists and writeFile, each re-exported from its own folder one level down.
      if (filePath.includes('packages/@gateway/node/src/fs__promises/fs__promises.ts')) {
        return FileContentsStub({
          value: `
        export * from 'fs/promises';
        export { readJsonFileIfExists } from './read-json-file-if-exists/read-json-file-if-exists';
        export { writeFile } from './write-file/write-file';
      `,
        });
      }

      // Orchestrator's own root barrel (packages/orchestrator/src/index.ts): a bare
      // '@dungeonmaster/orchestrator' import's proxy is resolved from THIS file, exactly the way
      // a gateway subpath's own production barrel resolves a gateway import's proxy.
      if (filePath.includes('packages/orchestrator/src/index.ts')) {
        return FileContentsStub({
          value: `
        export { StartOrchestrator } from './startup/start-orchestrator';
        export { agentRoleContract } from './contracts/agent-role/agent-role-contract';
      `,
        });
      }

      // StartOrchestrator's own colocated cross-package composing proxy exists on disk (A00) —
      // this is what tells enforce-proxy-child-creation the name is WRAPPED, not a pass-through.
      if (filePath.includes('packages/orchestrator/src/startup/start-orchestrator.proxy.ts')) {
        return FileContentsStub({ value: `export const StartOrchestratorProxy = () => ({});` });
      }

      // Adapter that imports StartOrchestrator bare-root, per-file, and uses it — the real A00
      // shape (packages/mcp/src/adapters/orchestrator/get-next-step/...).
      if (
        filePath.includes(
          'adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.ts',
        )
      ) {
        return FileContentsStub({
          value: `
        import { StartOrchestrator } from '@dungeonmaster/orchestrator';

        export const orchestratorGetNextStepAdapter = () => {
          return StartOrchestrator.getNextStep();
        };
      `,
        });
      }

      // Adapter that imports ONLY agentRoleContract bare-root (a pass-through — contracts use
      // stubs, never a proxy) — proves recording every bare-root name costs nothing extra.
      if (
        filePath.includes('adapters/orchestrator/agent-role/orchestrator-agent-role-adapter.ts')
      ) {
        return FileContentsStub({
          value: `
        import { agentRoleContract } from '@dungeonmaster/orchestrator';

        export const orchestratorAgentRoleAdapter = () => {
          return agentRoleContract;
        };
      `,
        });
      }

      // Adapter that imports NOTHING from '@dungeonmaster/orchestrator' at all — for the
      // still-flagged phantom-creation case: a proxy composing StartOrchestratorProxy() here has
      // nothing real behind it.
      if (filePath.includes('adapters/orchestrator/phantom/orchestrator-phantom-adapter.ts')) {
        return FileContentsStub({
          value: `
        export const orchestratorPhantomAdapter = () => {
          return { data: 'test' };
        };
      `,
        });
      }

      // A SECOND, differently-named workspace package — proves the mapping is not hardcoded to
      // orchestrator. Its own root barrel wraps DemoWidget from a widgets/ file.
      if (filePath.includes('packages/demo/src/index.ts')) {
        return FileContentsStub({
          value: `export { DemoWidget } from './widgets/demo/demo-widget';`,
        });
      }
      if (filePath.includes('packages/demo/src/widgets/demo/demo-widget.proxy.ts')) {
        return FileContentsStub({ value: `export const DemoWidgetProxy = () => ({});` });
      }
      if (filePath.includes('adapters/demo/demo-adapter.ts')) {
        return FileContentsStub({
          value: `
        import { DemoWidget } from '@dungeonmaster/demo';

        export const demoAdapter = () => {
          return DemoWidget;
        };
      `,
        });
      }

      // A CONSUMER repo's own workspace package, scoped '@acme' — not '@dungeonmaster' — proving
      // the workspace scope is read off the real workspace root (staged above at
      // '/acme-repo/package.json') rather than hardcoded to this repo's own scope.
      if (filePath.includes('acme-repo/packages/orders/src/index.ts')) {
        return FileContentsStub({
          value: `export { OrdersBroker } from './brokers/orders/orders-broker';`,
        });
      }
      if (
        filePath.includes('acme-repo/packages/orders/src/brokers/orders/orders-broker.proxy.ts')
      ) {
        return FileContentsStub({ value: `export const OrdersBrokerProxy = () => ({});` });
      }
      if (filePath.includes('acme-repo/packages/mcp/src/adapters/orders/orders-adapter.ts')) {
        return FileContentsStub({
          value: `
        import { OrdersBroker } from '@acme/orders';

        export const ordersAdapter = () => {
          return OrdersBroker.list();
        };
      `,
        });
      }

      // F13 regression fixture: same shape as the '/acme-repo' case above, under the root staged
      // at '/acme-devdeps-repo/package.json' (root `devDependencies` hold '@dungeonmaster/*'
      // tooling, no root `dependencies` at all).
      if (filePath.includes('acme-devdeps-repo/packages/orders/src/index.ts')) {
        return FileContentsStub({
          value: `export { OrdersBroker } from './brokers/orders/orders-broker';`,
        });
      }
      if (
        filePath.includes(
          'acme-devdeps-repo/packages/orders/src/brokers/orders/orders-broker.proxy.ts',
        )
      ) {
        return FileContentsStub({ value: `export const OrdersBrokerProxy = () => ({});` });
      }
      if (
        filePath.includes('acme-devdeps-repo/packages/mcp/src/adapters/orders/orders-adapter.ts')
      ) {
        return FileContentsStub({
          value: `
        import { OrdersBroker } from '@acme/orders';

        export const ordersAdapter = () => {
          return OrdersBroker.list();
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
    // ✅ CORRECT - Mixed named import with a per-name type-only specifier: proxy creates
    // walkBrokerProxy only. WalkMemo is a type, so no WalkMemoProxy is demanded (G06).
    {
      code: `
        import { walkBrokerProxy } from '../../brokers/walk/walk-broker.proxy';

        export const walkConsumerBrokerProxy = () => {
          const walkProxy = walkBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/walk-consumer/walk-consumer-broker.proxy.ts',
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
    // ✅ CORRECT - Widget proxy with .tsx extension
    {
      code: `
        import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';

        export const ButtonWidgetProxy = () => {
          const boxProxy = inkBoxAdapterProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/widgets/button/button-widget.proxy.tsx',
    },
    // ✅ CORRECT - Gateway pass-through import (@scope/npm/zod): the npm production barrel has no
    // wrapper folder behind `z`, so no proxy is required at all.
    {
      code: `
        export const zodImportBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/zod-import/zod-import-broker.proxy.ts',
    },
    // ✅ CORRECT - Gateway import, per-file form: proxy imports and creates each wrapper's own
    // proxy directly, reading the subpath's PRODUCTION barrel (never a `_test_` barrel, which does
    // not exist) to find which folder exports each name.
    {
      code: `
        import { readJsonFileIfExistsProxy } from '@dungeonmaster/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
        import { writeFileProxy } from '@dungeonmaster/node/fs__promises/write-file/write-file.proxy';

        export const installConfigCreatePerFileResponderProxy = () => {
          const readProxy = readJsonFileIfExistsProxy();
          const writeProxy = writeFileProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/responders/install/config-create/install-config-create-per-file-responder.proxy.ts',
    },
    // ✅ CORRECT - Gateway import through the '#gateway/...' import-alias form, per-file: same as
    // above, proving the alias resolves through the identical per-file acceptance path.
    {
      code: `
        import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
        import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

        export const installConfigCreateGatewayAliasPerFileResponderProxy = () => {
          const readProxy = readJsonFileIfExistsProxy();
          const writeProxy = writeFileProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/responders/install/config-create/install-config-create-gateway-alias-per-file-responder.proxy.ts',
    },
    // ✅ CORRECT - Bare workspace-package ROOT import (A00): the implementation reaches
    // StartOrchestrator via '@dungeonmaster/orchestrator', no folder-type subpath at all, and the
    // proxy composes orchestrator's OWN cross-package composing proxy per file, resolved from
    // orchestrator's own root barrel (src/index.ts) exactly the way a gateway import resolves
    // against a subpath's own production barrel.
    {
      code: `
        import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

        export const orchestratorGetNextStepAdapterProxy = () => {
          const orchestrator = StartOrchestratorProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.proxy.ts',
    },
    // ✅ CORRECT - Bare workspace-package ROOT import of a name with NO colocated proxy on disk
    // (a contract, re-exported from orchestrator's root barrel same as StartOrchestrator) — a
    // pass-through, needing nothing from the proxy, exactly like a gateway pass-through needs
    // nothing.
    {
      code: `
        export const orchestratorAgentRoleAdapterProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/adapters/orchestrator/agent-role/orchestrator-agent-role-adapter.proxy.ts',
    },
    // ✅ CORRECT - A SECOND, differently-named workspace package (not orchestrator): proves the
    // bare-root mapping reads each package's OWN root barrel rather than a hardcoded name.
    {
      code: `
        import { DemoWidgetProxy } from '@dungeonmaster/demo/widgets/demo/demo-widget.proxy';

        export const demoAdapterProxy = () => {
          const demoProxy = DemoWidgetProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/adapters/demo/demo-adapter.proxy.ts',
    },
    // ✅ CORRECT - A CONSUMER repo's own workspace, scoped '@acme' rather than '@dungeonmaster' —
    // proves the workspace scope is read off the REAL workspace root (this repo's own operator
    // flagged the earlier hardcoded '@dungeonmaster' as a blocker for exactly this case).
    {
      code: `
        import { OrdersBrokerProxy } from '@acme/orders/brokers/orders/orders-broker.proxy';

        export const ordersAdapterProxy = () => {
          const ordersProxy = OrdersBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-repo/packages/mcp/src/adapters/orders/orders-adapter.proxy.ts',
    },
    // ✅ CORRECT - F13: the SAME consumer scope resolves correctly even when root `devDependencies`
    // hold '@dungeonmaster/*' tooling and root `dependencies` holds nothing at all — proving the
    // scope comes from the workspace root's own package.json `name`, never from a dependency scan
    // that would otherwise pick up the tool vendor's own scope first.
    {
      code: `
        import { OrdersBrokerProxy } from '@acme/orders/brokers/orders/orders-broker.proxy';

        export const ordersAdapterProxy = () => {
          const ordersProxy = OrdersBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-devdeps-repo/packages/mcp/src/adapters/orders/orders-adapter.proxy.ts',
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
    // ❌ WRONG - Widget proxy with .tsx extension missing proxy import
    {
      code: `
        export const ButtonWidgetProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/widgets/button/button-widget.proxy.tsx',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'inkBoxAdapter',
            proxyPath: '../../adapters/ink/box/ink-box-adapter.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Proxy missing import when implementation has .tsx in import path
    {
      code: `
        export const tsxImportBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/tsx-import/tsx-import-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'inkBoxAdapter',
            proxyPath: '../../adapters/ink/box/ink-box-adapter.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Gateway import at a deep subpath (@scope/node/fs/promises), no proxy import or
    // creation at all — the exact misfire this rule silently missed before, reproduced from the
    // mcp config-create trial unit's readJsonFileIfExists/writeFile pair.
    {
      code: `
        export const installConfigCreateNoProxyResponderProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/responders/install/config-create/install-config-create-no-proxy-responder.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'readJsonFileIfExists',
            proxyPath:
              '@dungeonmaster/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy',
          },
        },
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'writeFile',
            proxyPath: '@dungeonmaster/node/fs__promises/write-file/write-file.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Gateway import through the '#gateway/...' import-alias form, no proxy import or
    // creation at all — the suggested proxyPath must carry the '#gateway' form the implementation
    // actually used, not the '@dungeonmaster' one.
    {
      code: `
        export const installConfigCreateGatewayAliasNoProxyResponderProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/responders/install/config-create/install-config-create-gateway-alias-no-proxy-responder.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'readJsonFileIfExists',
            proxyPath:
              '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy',
          },
        },
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'writeFile',
            proxyPath: '#gateway/node/fs__promises/write-file/write-file.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Bare workspace-package ROOT import (A00), no proxy import or creation at all —
    // still flagged after teaching the transformer the bare-root form: a genuinely missing child
    // proxy for StartOrchestrator must still be caught, not silently waved through.
    {
      code: `
        export const orchestratorGetNextStepAdapterProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/adapters/orchestrator/get-next-step/orchestrator-get-next-step-adapter.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'StartOrchestrator',
            proxyPath: '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Phantom proxy creation, bare workspace-package-root form: the proxy composes
    // StartOrchestratorProxy() but this implementation imports nothing from
    // '@dungeonmaster/orchestrator' at all — still flagged, proving the fix does not exempt every
    // bare-root creation from the phantom check.
    {
      code: `
        import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

        export const orchestratorPhantomAdapterProxy = () => {
          const orchestrator = StartOrchestratorProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/adapters/orchestrator/phantom/orchestrator-phantom-adapter.proxy.ts',
      errors: [
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'StartOrchestratorProxy',
            implementationFile: 'orchestrator-phantom-adapter.ts',
            implementationName: 'StartOrchestrator',
          },
        },
      ],
    },
    // ❌ WRONG - A CONSUMER repo's own workspace ('@acme'), no proxy import or creation at all —
    // still flagged: the scope-detection fix must not silently exempt a real consumer's own
    // missing child proxy just because it is not '@dungeonmaster'.
    {
      code: `
        export const ordersAdapterProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-repo/packages/mcp/src/adapters/orders/orders-adapter.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'OrdersBroker',
            proxyPath: '@acme/orders/brokers/orders/orders-broker.proxy',
          },
        },
      ],
    },
  ],
});
