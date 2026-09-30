import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';
import { ruleEnforceProxyChildCreationBroker } from './rule-enforce-proxy-child-creation-broker';
import { ruleEnforceProxyChildCreationBrokerProxy } from './rule-enforce-proxy-child-creation-broker.proxy';

type FileContents = string;
type FilePath = string;

const ruleTester = ruleTesterHarness();

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
        return JSON.stringify({
          name: 'dungeonmaster',
          workspaces: ['packages/*'],
        });
      }
      if (filePath === '/acme-repo/package.json') {
        return JSON.stringify({
          name: '@acme/repo',
          workspaces: ['packages/*'],
        });
      }
      // F13 regression: a fresh consumer's root `dependencies` holds NOTHING yet (no workspace
      // package has ever been registered there — `create-package`'s "register" step is what adds
      // one, and this repo's own `install-setup-gateway-responder` never touches root `dependencies`
      // either), while `devDependencies` already carries the `@dungeonmaster/*` tooling `dungeonmaster
      // init` installed. The scope must still come out '@acme', from the root `name` alone.
      if (filePath === '/acme-devdeps-repo/package.json') {
        return JSON.stringify({
          name: '@acme/repo',
          workspaces: ['packages/*'],
          devDependencies: { '@dungeonmaster/cli': '*', '@dungeonmaster/testing': '*' },
        });
      }
      if (filePath.endsWith('/package.json')) {
        return null;
      }

      // All broker files that import httpBroker only
      if (
        filePath.includes('brokers/user/user-broker.ts') ||
        filePath.includes('brokers/user/no-creation-broker.ts') ||
        filePath.includes('brokers/user/after-return-broker.ts') ||
        filePath.includes('brokers/user/phantom-proxy-broker.ts')
      ) {
        return `
        import { httpBroker } from '../../brokers/http/http-broker';

        export const userBroker = () => {
          return httpBroker.get();
        };
      `;
      }

      // Empty broker with no imports
      if (filePath.includes('brokers/empty/empty-broker.ts')) {
        return `
        export const emptyBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // user-broker.ts with multiple brokers
      if (
        filePath.includes('brokers/user-multi/user-broker.ts') ||
        filePath.includes('brokers/user-multi/missing-db-broker.ts') ||
        filePath.includes('brokers/user-multi/no-proxies-broker.ts')
      ) {
        return `
        import { httpBroker } from '../../brokers/http/http-broker';
        import { dbBroker } from '../../brokers/db/db-broker';

        export const userBroker = () => {
          const http = httpBroker.get();
          const db = dbBroker.query();
          return { http, db };
        };
      `;
      }

      // user-transformer.ts - no dependencies
      if (filePath.includes('transformers/user/user-transformer.ts')) {
        return `
        export const userTransformer = (data: unknown) => {
          return { name: 'John' };
        };
      `;
      }

      // user-guard.ts - only contracts
      if (filePath.includes('guards/user/user-guard.ts')) {
        return `
        import type { User } from '../../contracts/user/user-contract';

        export const userGuard = (user: User): boolean => {
          return user.isActive;
        };
      `;
      }

      // Broker that imports transformer (requireProxy: false)
      if (filePath.includes('brokers/user-with-transformer/user-broker.ts')) {
        return `
        import { formatDateTransformer } from '../../transformers/format-date/format-date-transformer';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Broker that imports guard (requireProxy: false)
      if (filePath.includes('brokers/user-with-guard/user-broker.ts')) {
        return `
        import { hasPermissionGuard } from '../../guards/has-permission/has-permission-guard';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Broker that imports statics (requireProxy: false)
      if (filePath.includes('brokers/user-with-statics/user-broker.ts')) {
        return `
        import { userStatics } from '../../statics/user/user-statics';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Broker that imports error (requireProxy: false)
      if (filePath.includes('brokers/user-with-error/user-broker.ts')) {
        return `
        import { ValidationError } from '../../errors/validation/validation-error';

        export const userBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Broker that imports a mixed named import: a real value alongside a per-name
      // type-only specifier ('{ walkBroker, type WalkMemo }') — the exact G06 regression
      // case, where WalkMemo must never be treated as a value needing its own proxy.
      if (filePath.includes('brokers/walk-consumer/walk-consumer-broker.ts')) {
        return `
        import { walkBroker, type WalkMemo } from '../../brokers/walk/walk-broker';

        export const walkConsumerBroker = () => {
          return walkBroker();
        };
      `;
      }

      // Broker that imports another broker (requireProxy: true) - same folder type
      if (
        filePath.includes(
          'brokers/user-orchestration/orchestrate/user-orchestration-orchestrate-broker.ts',
        )
      ) {
        return `
        import { userFetchBroker } from '../../user/fetch/user-fetch-broker';
        import { emailSendBroker } from '../../email/send/email-send-broker';

        export const userOrchestrationOrchestrateBroker = () => {
          const user = userFetchBroker();
          emailSendBroker({ to: user.email });
        };
      `;
      }

      // eslint-rule-tester-broker.ts - has example code in comments
      if (filePath.includes('brokers/eslint/rule-tester/eslint-rule-tester-broker.ts')) {
        return `
        /**
         * @example
         * \`\`\`typescript
         * import { eslintRuleTesterBroker } from '../../../brokers/eslint/rule-tester/eslint-rule-tester-broker';
         * import { myRuleBroker } from './my-rule-broker';
         *
         * const ruleTester = eslintRuleTesterBroker();
         * \`\`\`
         */
        export const eslintRuleTesterBroker = (): RuleTester => {
          return new RuleTester();
        };
      `;
      }

      // http-broker.ts - only npm packages
      if (filePath.includes('brokers/http/http-broker.ts')) {
        return `
        import axios from 'axios';

        export const httpBroker = {
          get: async () => axios.get('/api')
        };
      `;
      }

      // test-file-path-variants-transformer.ts - imports statics
      if (
        filePath.includes(
          'transformers/test-file-path-variants/test-file-path-variants-transformer.ts',
        )
      ) {
        return `
        import { testFilePatternStatics } from '../../statics/test-file-pattern/test-file-pattern-statics';

        export const testFilePathVariantsTransformer = ({ sourceFilePath }) => {
          return testFilePatternStatics.suffixes.map((suffix) => \`\${sourceFilePath}\${suffix}\`);
        };
      `;
      }

      // Folder-type barrels of the packages the scoped fixtures import from: each maps a name to the
      // file it re-exports, and that file's own proxy is what a caller's proxy imports.
      if (filePath.includes('packages/shared/src/brokers/brokers.ts')) {
        return `export { projectRootFindBroker } from './project-root/find/project-root-find-broker';`;
      }
      if (filePath.includes('packages/core/src/brokers/brokers.ts')) {
        return `export { userBroker } from './user/user-broker';`;
      }
      if (filePath.includes('packages/utils/src/brokers/brokers.ts')) {
        return `export { logBroker } from './log/log-broker';`;
      }

      // Broker that imports from scoped package with folder type subpath
      if (filePath.includes('brokers/scoped-import/scoped-broker.ts')) {
        return `
        import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';
        import { httpBroker } from '../../brokers/http/http-broker';

        export const scopedBroker = () => {
          const root = projectRootFindBroker();
          return { root };
        };
      `;
      }

      // Broker that imports only from scoped package (no relative imports)
      if (filePath.includes('brokers/scoped-only/scoped-only-broker.ts')) {
        return `
        import { projectRootFindBroker } from '@dungeonmaster/shared/brokers';

        export const scopedOnlyBroker = () => {
          const root = projectRootFindBroker();
          return { root };
        };
      `;
      }

      // Broker that imports from scoped package with non-proxy folder type
      if (filePath.includes('brokers/scoped-contracts/scoped-contracts-broker.ts')) {
        return `
        import { userContract } from '@dungeonmaster/shared/contracts';
        import { httpBroker } from '../../brokers/http/http-broker';

        export const scopedContractsBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Broker that imports from different scoped package (@acme/core)
      if (filePath.includes('brokers/acme-import/acme-broker.ts')) {
        return `
        import { userBroker } from '@acme/core/brokers';
        import { httpBroker } from '../../brokers/http/http-broker';

        export const acmeBroker = () => {
          const user = userBroker();
          return { user };
        };
      `;
      }

      // Broker that imports from different scoped package (@myorg/utils)
      if (filePath.includes('brokers/myorg-import/myorg-broker.ts')) {
        return `
        import { logBroker } from '@myorg/utils/brokers';

        export const myorgBroker = () => {
          const log = logBroker();
          return { log };
        };
      `;
      }

      // Broker that imports from different scoped package with non-proxy folder type
      if (filePath.includes('brokers/acme-contracts/acme-contracts-broker.ts')) {
        return `
        import { userContract } from '@acme/core/contracts';
        import { httpBroker } from '../../brokers/http/http-broker';

        export const acmeContractsBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // Widget implementation that imports layer widgets (tsx)
      if (filePath.includes('widgets/button/button-widget.tsx')) {
        return `
        import { inkBoxBroker } from '../../brokers/ink/box/ink-box-broker';

        export const ButtonWidget = () => {
          return inkBoxBroker();
        };
      `;
      }

      // Broker that imports with .tsx extension in import path
      if (filePath.includes('brokers/tsx-import/tsx-import-broker.ts')) {
        return `
        import { inkBoxBroker } from '../../brokers/ink/box/ink-box-broker.tsx';

        export const tsxImportBroker = () => {
          return inkBoxBroker();
        };
      `;
      }

      // Gateway implementation (node): imports two wrapped fs/promises exports at a deep
      // subpath, reproducing the exact misfire found in the mcp config-create trial unit.
      if (
        filePath.includes('install-config-create-responder.ts') ||
        filePath.includes('install-config-create-no-proxy-responder.ts') ||
        filePath.includes('install-config-create-per-file-responder.ts')
      ) {
        return `
        import { join } from '@dungeonmaster/node/path';
        import { readJsonFileIfExists, writeFile } from '@dungeonmaster/node/fs__promises';

        export const installConfigCreateResponder = async () => {
          const configPath = join('/repo', '.mcp.json');
          const existing = await readJsonFileIfExists(configPath);
          await writeFile(configPath, JSON.stringify(existing));
        };
      `;
      }

      // Gateway implementation (node), imported through the '#gateway/...' import-alias form:
      // same shape as install-config-create-responder.ts above, proving the alias resolves
      // through the identical proxy-child-creation path as the '@dungeonmaster/...' form.
      if (
        filePath.includes('install-config-create-gateway-alias-responder.ts') ||
        filePath.includes('install-config-create-gateway-alias-no-proxy-responder.ts') ||
        filePath.includes('install-config-create-gateway-alias-per-file-responder.ts')
      ) {
        return `
        import { join } from '#gateway/node/path';
        import { readJsonFileIfExists, writeFile } from '#gateway/node/fs__promises';

        export const installConfigCreateGatewayAliasResponder = async () => {
          const configPath = join('/repo', '.mcp.json');
          const existing = await readJsonFileIfExists(configPath);
          await writeFile(configPath, JSON.stringify(existing));
        };
      `;
      }

      // Gateway implementation (npm pass-through): imports zod's own `z`, which is never
      // wrapped, so it needs no proxy at all.
      if (filePath.includes('zod-import-broker.ts')) {
        return `
        import { z } from '@dungeonmaster/npm/zod';

        export const zodImportBroker = () => {
          return z.string();
        };
      `;
      }

      // The node fs__promises subpath's own PRODUCTION barrel: names the wrapper folder behind every
      // WRAPPED export. 'join' from @scope/node/path is never re-exported from a local wrapper folder
      // here — path does no I/O and is a pure pass-through — unlike fs__promises's
      // readJsonFileIfExists and writeFile, each re-exported from its own folder one level down.
      if (filePath.includes('packages/@gateway/node/src/fs__promises/fs__promises.ts')) {
        return `
        export * from 'fs/promises';
        export { readJsonFileIfExists } from './read-json-file-if-exists/read-json-file-if-exists';
        export { writeFile } from './write-file/write-file';
      `;
      }

      // Orchestrator's own root barrel (packages/orchestrator/src/index.ts): a bare
      // '@dungeonmaster/orchestrator' import's proxy is resolved from THIS file, exactly the way
      // a gateway subpath's own production barrel resolves a gateway import's proxy.
      if (filePath.includes('packages/orchestrator/src/index.ts')) {
        return `
        export { StartOrchestrator } from './startup/start-orchestrator';
        export { agentRoleContract } from './contracts/agent-role/agent-role-contract';
      `;
      }

      // StartOrchestrator's own colocated cross-package composing proxy exists on disk (A00) —
      // this is what tells enforce-proxy-child-creation the name is WRAPPED, not a pass-through.
      if (filePath.includes('packages/orchestrator/src/startup/start-orchestrator.proxy.ts')) {
        return `export const StartOrchestratorProxy = () => ({});`;
      }

      // Broker that imports StartOrchestrator bare-root, per-file, and uses it — the real A00
      // shape (packages/mcp/src/brokers/orchestrator/get-next-step/...).
      if (
        filePath.includes('brokers/orchestrator/get-next-step/orchestrator-get-next-step-broker.ts')
      ) {
        return `
        import { StartOrchestrator } from '@dungeonmaster/orchestrator';

        export const orchestratorGetNextStepBroker = () => {
          return StartOrchestrator.getNextStep();
        };
      `;
      }

      // Broker that imports ONLY agentRoleContract bare-root (a pass-through — contracts use
      // stubs, never a proxy) — proves recording every bare-root name costs nothing extra.
      if (filePath.includes('brokers/orchestrator/agent-role/orchestrator-agent-role-broker.ts')) {
        return `
        import { agentRoleContract } from '@dungeonmaster/orchestrator';

        export const orchestratorAgentRoleBroker = () => {
          return agentRoleContract;
        };
      `;
      }

      // Broker that imports NOTHING from '@dungeonmaster/orchestrator' at all — for the
      // still-flagged phantom-creation case: a proxy composing StartOrchestratorProxy() here has
      // nothing real behind it.
      if (filePath.includes('brokers/orchestrator/phantom/orchestrator-phantom-broker.ts')) {
        return `
        export const orchestratorPhantomBroker = () => {
          return { data: 'test' };
        };
      `;
      }

      // A SECOND, differently-named workspace package — proves the mapping is not hardcoded to
      // orchestrator. Its own root barrel wraps DemoWidget from a widgets/ file.
      if (filePath.includes('packages/demo/src/index.ts')) {
        return `export { DemoWidget } from './widgets/demo/demo-widget';`;
      }
      if (filePath.includes('packages/demo/src/widgets/demo/demo-widget.proxy.ts')) {
        return `export const DemoWidgetProxy = () => ({});`;
      }
      if (filePath.includes('brokers/demo/demo-broker.ts')) {
        return `
        import { DemoWidget } from '@dungeonmaster/demo';

        export const demoBroker = () => {
          return DemoWidget;
        };
      `;
      }

      // A CONSUMER repo's own workspace package, scoped '@acme' — not '@dungeonmaster' — proving
      // the workspace scope is read off the real workspace root (staged above at
      // '/acme-repo/package.json') rather than hardcoded to this repo's own scope.
      if (filePath.includes('acme-repo/packages/orders/src/index.ts')) {
        return `export { OrdersBroker } from './brokers/orders/orders-broker';`;
      }
      if (
        filePath.includes('acme-repo/packages/orders/src/brokers/orders/orders-broker.proxy.ts')
      ) {
        return `export const OrdersBrokerProxy = () => ({});`;
      }
      if (filePath.includes('acme-repo/packages/mcp/src/brokers/orders/orders-broker.ts')) {
        return `
        import { OrdersBroker } from '@acme/orders';

        export const ordersBroker = () => {
          return OrdersBroker.list();
        };
      `;
      }

      // F13 regression fixture: same shape as the '/acme-repo' case above, under the root staged
      // at '/acme-devdeps-repo/package.json' (root `devDependencies` hold '@dungeonmaster/*'
      // tooling, no root `dependencies` at all).
      if (filePath.includes('acme-devdeps-repo/packages/orders/src/index.ts')) {
        return `export { OrdersBroker } from './brokers/orders/orders-broker';`;
      }
      if (
        filePath.includes(
          'acme-devdeps-repo/packages/orders/src/brokers/orders/orders-broker.proxy.ts',
        )
      ) {
        return `export const OrdersBrokerProxy = () => ({});`;
      }
      if (filePath.includes('acme-devdeps-repo/packages/mcp/src/brokers/orders/orders-broker.ts')) {
        return `
        import { OrdersBroker } from '@acme/orders';

        export const ordersBroker = () => {
          return OrdersBroker.list();
        };
      `;
      }

      // Default empty implementation
      return `export const placeholder = () => {};`;
    },
  });
});

ruleTester.run('enforce-proxy-child-creation', ruleEnforceProxyChildCreationBroker(), {
  valid: [
    // ✅ CORRECT - banWrapperMocks on: mocking a gateway PASS-THROUGH (mkdir is re-exported by
    // `export * from 'fs/promises'`, no wrapper folder) stays legal
    {
      code: `
        import { mkdir } from '#gateway/node/fs__promises';

        export const wrapperMockPassThroughBrokerProxy = () => {
          registerMock({ fn: mkdir });

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/brokers/wrapper-mock/pass-through/wrapper-mock-pass-through-broker.proxy.ts',
      options: [{ banWrapperMocks: true }],
    },
    // ✅ CORRECT - banWrapperMocks on: the wrapper's OWN proxy, inside the gateway, mocks the
    // outside call it wraps
    {
      code: `
        import { writeFile } from '#gateway/node/fs__promises';

        export const writeFileProxy = () => {
          registerMock({ fn: writeFile });

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/@gateway/node/src/fs__promises/write-file/write-file.proxy.ts',
      options: [{ banWrapperMocks: true }],
    },
    // ✅ CORRECT - option absent: the ban is off
    {
      code: `
        import { writeFile } from '#gateway/node/fs__promises';

        export const wrapperMockOffBrokerProxy = () => {
          registerMock({ fn: writeFile });

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/wrapper-mock/off/wrapper-mock-off-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports and creates child proxy
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

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
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';
        import { dbBrokerProxy } from '../../brokers/db/db-broker.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();
          const dbProxy = dbBrokerProxy();

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
    // ✅ CORRECT - Child proxy created via spread directly in an implicit-return object literal
    // (no ReturnStatement node exists at all for this shape, so the call is tracked no matter what).
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const userBrokerProxy = () => ({
          ...httpBrokerProxy(),
        });
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
    },
    // ✅ CORRECT - Child proxy created via spread directly in a BLOCK-bodied return statement's own
    // object literal — the identical content as the implicit-return case above, just block-bodied.
    // Must be accepted the same way: the spread runs eagerly when userBrokerProxy() is called, not
    // deferred inside a nested returned method.
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const userBrokerProxy = () => {
          return {
            ...httpBrokerProxy(),
          };
        };
      `,
      filename: '/project/src/brokers/user/user-broker.proxy.ts',
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

        export const httpBrokerProxy = () => {
          const mock = jest.mocked(axios);
          mock.mockImplementation(async () => ({ data: {} }));

          return {
            returns: () => {}
          };
        };
      `,
      filename: '/project/src/brokers/http/http-broker.proxy.ts',
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
        import { eslintRuleTesterBroker } from './eslint-rule-tester-broker';

        export const eslintRuleTesterBrokerProxy = (): {
          returnsRuleTester: () => RuleTester;
        } => {
          const ruleTester = eslintRuleTesterBroker();

          return {
            returnsRuleTester: (): RuleTester => ruleTester,
          };
        };
      `,
      filename: '/project/src/brokers/eslint/rule-tester/eslint-rule-tester-broker.proxy.ts',
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
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy';
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const scopedBrokerProxy = () => {
          const projectRootProxy = projectRootFindBrokerProxy();
          const httpProxy = httpBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/scoped-import/scoped-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports only from scoped package
    {
      code: `
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy';

        export const scopedOnlyBrokerProxy = () => {
          const projectRootProxy = projectRootFindBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/scoped-only/scoped-only-broker.proxy.ts',
    },
    // ✅ CORRECT - Implementation imports from scoped package with non-proxy folder type (contracts)
    {
      code: `
        import { userContract } from '@dungeonmaster/shared/contracts';
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const scopedContractsBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

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
        import { userBrokerProxy } from '@acme/core/brokers/user/user-broker.proxy';
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const acmeBrokerProxy = () => {
          const userProxy = userBrokerProxy();
          const httpProxy = httpBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/acme-import/acme-broker.proxy.ts',
    },
    // ✅ CORRECT - Proxy imports only from different scoped package (@myorg/utils)
    {
      code: `
        import { logBrokerProxy } from '@myorg/utils/brokers/log/log-broker.proxy';

        export const myorgBrokerProxy = () => {
          const logProxy = logBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/myorg-import/myorg-broker.proxy.ts',
    },
    // ✅ CORRECT - Implementation imports from different scoped package with non-proxy folder type
    {
      code: `
        import { userContract } from '@acme/core/contracts';
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const acmeContractsBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

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
        import { inkBoxBrokerProxy } from '../../brokers/ink/box/ink-box-broker.proxy';

        export const ButtonWidgetProxy = () => {
          const boxProxy = inkBoxBrokerProxy();

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

        export const orchestratorGetNextStepBrokerProxy = () => {
          const orchestrator = StartOrchestratorProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/brokers/orchestrator/get-next-step/orchestrator-get-next-step-broker.proxy.ts',
    },
    // ✅ CORRECT - Bare workspace-package ROOT import of a name with NO colocated proxy on disk
    // (a contract, re-exported from orchestrator's root barrel same as StartOrchestrator) — a
    // pass-through, needing nothing from the proxy, exactly like a gateway pass-through needs
    // nothing.
    {
      code: `
        export const orchestratorAgentRoleBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/brokers/orchestrator/agent-role/orchestrator-agent-role-broker.proxy.ts',
    },
    // ✅ CORRECT - A SECOND, differently-named workspace package (not orchestrator): proves the
    // bare-root mapping reads each package's OWN root barrel rather than a hardcoded name.
    {
      code: `
        import { DemoWidgetProxy } from '@dungeonmaster/demo/widgets/demo/demo-widget.proxy';

        export const demoBrokerProxy = () => {
          const demoProxy = DemoWidgetProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/demo/demo-broker.proxy.ts',
    },
    // ✅ CORRECT - A CONSUMER repo's own workspace, scoped '@acme' rather than '@dungeonmaster' —
    // proves the workspace scope is read off the REAL workspace root (this repo's own operator
    // flagged the earlier hardcoded '@dungeonmaster' as a blocker for exactly this case).
    {
      code: `
        import { OrdersBrokerProxy } from '@acme/orders/brokers/orders/orders-broker.proxy';

        export const ordersBrokerProxy = () => {
          const ordersProxy = OrdersBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-repo/packages/mcp/src/brokers/orders/orders-broker.proxy.ts',
    },
    // ✅ CORRECT - F13: the SAME consumer scope resolves correctly even when root `devDependencies`
    // hold '@dungeonmaster/*' tooling and root `dependencies` holds nothing at all — proving the
    // scope comes from the workspace root's own package.json `name`, never from a dependency scan
    // that would otherwise pick up the tool vendor's own scope first.
    {
      code: `
        import { OrdersBrokerProxy } from '@acme/orders/brokers/orders/orders-broker.proxy';

        export const ordersBrokerProxy = () => {
          const ordersProxy = OrdersBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-devdeps-repo/packages/mcp/src/brokers/orders/orders-broker.proxy.ts',
    },
  ],
  invalid: [
    // ❌ WRONG - banWrapperMocks on: a proxy outside the gateway mocks a gateway wrapper
    {
      code: `
        import { writeFile } from '#gateway/node/fs__promises';

        export const wrapperMockBrokerProxy = () => {
          registerMock({ fn: writeFile });

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/wrapper-mock/on/wrapper-mock-on-broker.proxy.ts',
      options: [{ banWrapperMocks: true }],
      errors: [{ messageId: 'composeWrapperProxy', data: { name: 'writeFile' } }],
    },
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
            implementationName: 'httpBroker',
            proxyPath: '../../brokers/http/http-broker.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Has proxy import but missing creation
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

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
            implementationName: 'httpBroker',
            proxyName: 'httpBrokerProxy',
          },
        },
      ],
    },
    // ❌ WRONG - Proxy created after return (not in constructor)
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const userBrokerProxy = () => {
          return {
            setup: () => {
              const httpProxy = httpBrokerProxy();
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
            implementationName: 'httpBroker',
            proxyName: 'httpBrokerProxy',
          },
        },
      ],
    },
    // ❌ WRONG - One missing proxy (has httpBroker, missing dbBroker)
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

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
            implementationName: 'dbBroker',
            proxyPath: '../../brokers/db/db-broker.proxy',
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
            implementationName: 'httpBroker',
            proxyPath: '../../brokers/http/http-broker.proxy',
          },
        },
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'dbBroker',
            proxyPath: '../../brokers/db/db-broker.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Phantom proxy (proxy creates dbBrokerProxy but impl doesn't use dbBroker)
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';
        import { dbBrokerProxy } from '../../brokers/db/db-broker.proxy';

        export const userBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();
          const dbProxy = dbBrokerProxy();

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
            proxyName: 'dbBrokerProxy',
            implementationFile: 'phantom-proxy-broker.ts',
            implementationName: 'dbBroker',
          },
        },
      ],
    },
    // ❌ WRONG - Multiple phantom proxies (impl uses nothing, proxy creates 2)
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';
        import { dbBrokerProxy } from '../../brokers/db/db-broker.proxy';

        export const emptyBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();
          const dbProxy = dbBrokerProxy();

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
            proxyName: 'httpBrokerProxy',
            implementationFile: 'empty-broker.ts',
            implementationName: 'httpBroker',
          },
        },
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'dbBrokerProxy',
            implementationFile: 'empty-broker.ts',
            implementationName: 'dbBroker',
          },
        },
      ],
    },
    // ❌ WRONG - Missing scoped package proxy import
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const scopedBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/scoped-import/scoped-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'projectRootFindBroker',
            proxyPath:
              '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Scoped package proxy imported but not created
    {
      code: `
        import { projectRootFindBrokerProxy } from '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy';
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const scopedBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/scoped-import/scoped-broker.proxy.ts',
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
      filename: '/repo/packages/mcp/src/brokers/scoped-only/scoped-only-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'projectRootFindBroker',
            proxyPath:
              '@dungeonmaster/shared/brokers/project-root/find/project-root-find-broker.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Missing proxy import from different scoped package (@acme/core)
    {
      code: `
        import { httpBrokerProxy } from '../../brokers/http/http-broker.proxy';

        export const acmeBrokerProxy = () => {
          const httpProxy = httpBrokerProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/acme-import/acme-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'userBroker',
            proxyPath: '@acme/core/brokers/user/user-broker.proxy',
          },
        },
      ],
    },
    // ❌ WRONG - Scoped package proxy from @myorg/utils imported but not created
    {
      code: `
        import { logBrokerProxy } from '@myorg/utils/brokers/log/log-broker.proxy';

        export const myorgBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/repo/packages/mcp/src/brokers/myorg-import/myorg-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyCreation',
          data: {
            implementationName: 'logBroker',
            proxyName: 'logBrokerProxy',
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
      filename: '/repo/packages/mcp/src/brokers/myorg-import/myorg-broker.proxy.ts',
      errors: [
        {
          messageId: 'missingProxyImport',
          data: {
            implementationName: 'logBroker',
            proxyPath: '@myorg/utils/brokers/log/log-broker.proxy',
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
            implementationName: 'inkBoxBroker',
            proxyPath: '../../brokers/ink/box/ink-box-broker.proxy',
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
            implementationName: 'inkBoxBroker',
            proxyPath: '../../brokers/ink/box/ink-box-broker.proxy',
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
        export const orchestratorGetNextStepBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/brokers/orchestrator/get-next-step/orchestrator-get-next-step-broker.proxy.ts',
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

        export const orchestratorPhantomBrokerProxy = () => {
          const orchestrator = StartOrchestratorProxy();

          return {
            setup: () => {}
          };
        };
      `,
      filename:
        '/repo/packages/mcp/src/brokers/orchestrator/phantom/orchestrator-phantom-broker.proxy.ts',
      errors: [
        {
          messageId: 'phantomProxyCreation',
          data: {
            proxyName: 'StartOrchestratorProxy',
            implementationFile: 'orchestrator-phantom-broker.ts',
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
        export const ordersBrokerProxy = () => {
          return {
            setup: () => {}
          };
        };
      `,
      filename: '/acme-repo/packages/mcp/src/brokers/orders/orders-broker.proxy.ts',
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
