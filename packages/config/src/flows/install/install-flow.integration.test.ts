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
            },
          },
          null,
          2,
        ),
      );
    });

    it('VALID: {context: config already exists} => skips installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
        content: FileContentStub({
          value: JSON.stringify({ framework: 'custom', schema: 'yup' }, null, 2),
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
        action: 'skipped',
        message: '.dungeonmaster.json already exists',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster.json' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(JSON.stringify({ framework: 'custom', schema: 'yup' }, null, 2));
    });
  });
});
