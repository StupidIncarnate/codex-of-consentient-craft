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
    it('VALID: {context: no existing config} => creates .dungeonmaster config', async () => {
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
        message: 'Created .dungeonmaster config',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(
        JSON.stringify({ framework: 'node-library', schema: 'zod' }, null, 2),
      );
    });

    it('VALID: {context: config already exists} => skips installation', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'skip-config' }),
      });

      testbed.writeFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster' }),
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
        message: 'Config already exists',
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster' }),
      });

      testbed.cleanup();

      expect(configContent).toBe(JSON.stringify({ framework: 'custom', schema: 'yup' }, null, 2));
    });
  });
});
