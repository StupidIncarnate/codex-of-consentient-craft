import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('install-flow integration', () => {
  describe('InstallFlow', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster.json config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-config' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'created',
        message: 'Created .dungeonmaster.json',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(
        JSON.stringify(
          {
            framework: 'monorepo',
            orchestrationMode: 'node',
            schema: 'zod',
            orchestration: { slotCount: 3, timeoutMs: 900000 },
            dungeonmaster: { port: 3737 },
            devServer: {
              devCommand: 'npm run dev',
              port: 3738,
              buildCommand: 'npm run build',
              readinessPath: '/',
              readinessTimeoutMs: 30000,
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
          },
          null,
          2,
        ),
      );
    });

    it('VALID: {context: existing config already has devServer.e2e} => skips, leaving the file untouched', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-config-has-e2e' }),
      });
      const existingContent = JSON.stringify(
        {
          framework: 'react',
          schema: 'zod',
          devServer: {
            devCommand: 'npm run dev',
            port: 3000,
            e2e: {
              processes: [{ name: 'api', command: 'npm start', portRole: 'api', readyPath: '/' }],
            },
          },
        },
        null,
        2,
      );

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({ value: existingContent }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json already exists',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(existingContent);
    });

    it('VALID: {context: existing config with a devServer block, no e2e} => adds the placeholder and keeps every other key', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'merge-config-with-devserver' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify(
            {
              framework: 'monorepo',
              schema: 'zod',
              customTopLevelField: 'keep-me',
              devServer: {
                devCommand: 'custom dev command',
                port: 4001,
                customDevServerField: 'also-keep-me',
              },
            },
            null,
            2,
          ),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'merged',
        message: 'Added the devServer.e2e.processes placeholder to existing .dungeonmaster.json',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(
        JSON.stringify(
          {
            framework: 'monorepo',
            schema: 'zod',
            customTopLevelField: 'keep-me',
            devServer: {
              devCommand: 'custom dev command',
              port: 4001,
              customDevServerField: 'also-keep-me',
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
          },
          null,
          2,
        ),
      );
    });

    it('VALID: {context: existing config with no devServer at all} => creates devServer and adds the placeholder', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'merge-config-no-devserver' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({ framework: 'react', schema: 'zod' }, null, 2),
        }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result.action).toBe('merged');

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(
        JSON.stringify(
          {
            framework: 'react',
            schema: 'zod',
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
          },
          null,
          2,
        ),
      );
    });

    it('INVALID: {context: existing .dungeonmaster.json is not valid JSON} => leaves it untouched and reports why', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-config-invalid-json' }),
      });
      const existingContent = '{ not valid json';

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({ value: existingContent }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json exists but is not valid JSON — left untouched',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(existingContent);
    });

    it('INVALID: {context: existing .dungeonmaster.json fails the config contract} => leaves it untouched and reports why', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-config-fails-contract' }),
      });
      const existingContent = JSON.stringify({ framework: 'custom', schema: 'yup' }, null, 2);

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({ value: existingContent }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/config',
        success: true,
        action: 'skipped',
        message: '.dungeonmaster.json exists but failed config validation — left untouched',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(existingContent);
    });
  });
});
