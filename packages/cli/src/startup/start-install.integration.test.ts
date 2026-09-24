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
          'Added devDependencies to package.json; target project is not e2e-eligible (packageType is not frontend-react or frontend-ink); Created tsconfig.json; Created jest.config.js',
      });
      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
      expect(packageJsonContent).toMatch(/^\s*"typescript": "\^5\.8\.3"$/mu);
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

      const typecheckHarness = scaffoldedTemplateTypecheckHarness();
      const diagnostics = typecheckHarness.typecheck({ content: String(writtenContent) });

      const runHarness = scaffoldedPlaywrightConfigRunHarness();
      runHarness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
      const { exitCode, stdout, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: { DUNGEONMASTER_PORT: '4101', DUNGEONMASTER_WEB_PORT: '4102' },
      });

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
      runHarness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: {},
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
      runHarness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: {},
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
      runHarness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: {},
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
      runHarness.installPlaywrightTestStub({ dirPath: testbed.guildPath });
      const { exitCode, stderr } = await runHarness.run({
        configPath: `${testbed.guildPath}/playwright.config.ts`,
        cwd: testbed.guildPath,
        env: {},
      });

      testbed.cleanup();

      expect(exitCode).toStrictEqual(ExitCodeStub({ value: 1 }));
      expect(stderr).toMatch(
        /^Error: playwright\.config\.ts: devServer\.e2e\.processes\["worker"\]\.portRole must be "api" or "web" in \.dungeonmaster\.json$/mu,
      );
    }, 30_000);
  });
});
