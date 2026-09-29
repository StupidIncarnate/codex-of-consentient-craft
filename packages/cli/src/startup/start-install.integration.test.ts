import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';
import { scaffoldedTemplateTypecheckHarness } from '../../test/harnesses/scaffolded-template-typecheck/scaffolded-template-typecheck.harness';
import { scaffoldedPlaywrightConfigRunHarness } from '../../test/harnesses/scaffolded-playwright-config-run/scaffolded-playwright-config-run.harness';

// The scaffolded playwright.config.ts imports @dungeonmaster/shared/contracts, a real workspace
// package — spawning it via tsx from a bare testbed dir under the OS /tmp finds nothing, since
// Node's bare-specifier resolution only walks up from the FILE's own directory. NODE_PATH adds
// this repo's real node_modules (where npm workspaces symlinks @dungeonmaster/shared) as an extra
// search root, letting the spawned process resolve it the same way a real consumer's own
// installed node_modules would. Measured: this needs no --conditions=source —
// @dungeonmaster/shared's published dist plus its package.json "imports" map for #gateway/*
// already resolves under plain Node, the same path a real consumer takes.
const REPO_NODE_MODULES = `${__dirname}/../../../../node_modules`;

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow and returns install result with devDependencies added', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-wiring' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      // The bare testbed (no src/widgets, no react dependency) is not e2e-eligible, so
      // create-playwright skips instead of writing a config — devDependencies/tsconfig/jest are
      // unaffected by that gate.
      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/cli',
        success: true,
        action: 'created',
        message:
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js; added packages/@gateway/* to workspaces; scaffolded gateway packages: npm, node, browser, bin; tsconfig.json already resolves node16; updated imports in 0 existing package(s); set gateway-dist in tsconfig.build.json of 0 existing package(s)',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
      // String-exact: the real on-disk write ends in one trailing newline.
      expect(String(packageJsonContent).endsWith('\n')).toBe(true);
      expect(String(packageJsonContent).endsWith('\n\n')).toBe(false);
    });
  });

  describe('scaffolded playwright.config.ts reads devServer.e2e.processes', () => {
    it('VALID: {e2e-eligible target, devServer.e2e.processes with an api and a web entry} => the written config maps each into webServer with tokens substituted', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'playwright-e2e-happy' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            name: 'happy-path',
            version: '0.0.0',
            dependencies: { react: '18.2.0' },
          }),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/marker.tsx' }),
        content: FileContentStub({ value: 'export {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            devServer: {
              e2e: {
                processes: [
                  {
                    name: 'api',
                    command: 'echo api-{apiPort}',
                    portRole: 'api',
                    readyPath: '/api/health',
                    env: { PORT: '{apiPort}' },
                  },
                  {
                    name: 'web',
                    command: 'echo web-{webPort}',
                    portRole: 'web',
                    readyPath: '/',
                  },
                ],
              },
            },
          }),
        }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const writtenContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'playwright.config.ts' }),
      });

      // The child starts before the in-process typecheck, so the two overlap: the typecheck
      // blocks this thread while the spawned tsx compiles on another core.
      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installGatewayNodeStub({ dirPath: testbed.guildPath });
      const runResult = runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: {
          DUNGEONMASTER_PORT: '4101',
          DUNGEONMASTER_WEB_PORT: '4102',
          NODE_PATH: REPO_NODE_MODULES,
        },
      });

      const typecheckHarness = scaffoldedTemplateTypecheckHarness();
      const diagnostics = typecheckHarness.typecheck({
        content: String(writtenContent),
        dirPath: testbed.guildPath,
      });

      const { exitCode, stdout, stderr } = await runResult;

      testbed.cleanup();

      expect(diagnostics).toStrictEqual([]);
      expect(stderr).toBe('');
      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 0 }));
      expect(JSON.parse(stdout)).toStrictEqual({
        testMatch: '**/*.e2e.ts',
        timeout: 30_000,
        use: { baseURL: 'http://127.0.0.1:4102' },
        outputDir: 'test-results/4101',
        webServer: [
          {
            command: 'echo api-4101',
            url: 'http://127.0.0.1:4101/api/health',
            reuseExistingServer: false,
            env: { DUNGEONMASTER_PORT: '4101', DUNGEONMASTER_WEB_PORT: '4102', PORT: '4101' },
          },
          {
            command: 'echo web-4102',
            url: 'http://127.0.0.1:4102/',
            reuseExistingServer: false,
            env: { DUNGEONMASTER_PORT: '4101', DUNGEONMASTER_WEB_PORT: '4102' },
          },
        ],
      });
    }, 30_000);

    it('ERROR: {e2e-eligible target, devServer.e2e.processes still the unedited seeded placeholder} => the written config refuses to load, naming the field to edit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'playwright-e2e-placeholder' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            name: 'placeholder-path',
            version: '0.0.0',
            dependencies: { react: '18.2.0' },
          }),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/marker.tsx' }),
        content: FileContentStub({ value: 'export {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            devServer: {
              e2e: {
                processes: [
                  {
                    name: 'app',
                    command: 'npm run dev:no-watch',
                    portRole: 'api',
                    readyPath: '/',
                    env: { PORT: '{apiPort}' },
                  },
                ],
              },
            },
          }),
        }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installGatewayNodeStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: { NODE_PATH: REPO_NODE_MODULES },
      });

      testbed.cleanup();

      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
      expect(stderr).toMatch(
        /^Error: playwright\.config\.ts found the unedited placeholder in devServer\.e2e\.processes\[0\] — edit devServer\.e2e\.processes in \.dungeonmaster\.json to point at your app's own no-watch dev command\.$/mu,
      );
    }, 30_000);

    it('ERROR: {e2e-eligible target, .dungeonmaster.json has no devServer.e2e} => the written config refuses to load, naming the field to edit', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'playwright-e2e-missing-config' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            name: 'missing-config-path',
            version: '0.0.0',
            dependencies: { react: '18.2.0' },
          }),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/marker.tsx' }),
        content: FileContentStub({ value: 'export {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({ value: JSON.stringify({ framework: 'monorepo' }) }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installGatewayNodeStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: { NODE_PATH: REPO_NODE_MODULES },
      });

      testbed.cleanup();

      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
      expect(stderr).toMatch(
        /^Error: playwright\.config\.ts found no devServer\.e2e\.processes in \.dungeonmaster\.json — edit that array to name your app's own no-watch dev command \(name, command, portRole, readyPath\), the same way you would write a Playwright webServer entry\.$/mu,
      );
    }, 30_000);

    it('ERROR: {e2e-eligible target, a process command uses {apiWorkspace}} => the written config refuses to load, naming the unresolvable token', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'playwright-e2e-unresolvable-token' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            name: 'unresolvable-token-path',
            version: '0.0.0',
            dependencies: { react: '18.2.0' },
          }),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/marker.tsx' }),
        content: FileContentStub({ value: 'export {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            devServer: {
              e2e: {
                processes: [
                  {
                    name: 'api',
                    command: 'npm run dev:no-watch --workspace={apiWorkspace}',
                    portRole: 'api',
                    readyPath: '/',
                  },
                ],
              },
            },
          }),
        }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installGatewayNodeStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: { NODE_PATH: REPO_NODE_MODULES },
      });

      testbed.cleanup();

      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
      expect(stderr).toMatch(
        /^Error: playwright\.config\.ts: devServer\.e2e\.processes\[\]\.command in \.dungeonmaster\.json uses \{apiWorkspace\}, which this scaffolded config cannot resolve — write a literal value instead\.$/mu,
      );
    }, 30_000);

    it('ERROR: {e2e-eligible target, a process portRole is neither api nor web} => the written config refuses to load, naming the process', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'playwright-e2e-bad-port-role' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            name: 'bad-port-role-path',
            version: '0.0.0',
            dependencies: { react: '18.2.0' },
          }),
        }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: 'src/widgets/marker.tsx' }),
        content: FileContentStub({ value: 'export {};\n' }),
      });
      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({
            devServer: {
              e2e: {
                processes: [
                  { name: 'worker', command: 'echo hi', portRole: 'worker', readyPath: '/' },
                ],
              },
            },
          }),
        }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installGatewayNodeStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: { NODE_PATH: REPO_NODE_MODULES },
      });

      testbed.cleanup();

      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
      expect(stderr).toMatch(
        /^Error: playwright\.config\.ts: devServer\.e2e\.processes\["worker"\]\.portRole must be "api" or "web" in \.dungeonmaster\.json$/mu,
      );
    }, 30_000);
  });
});
