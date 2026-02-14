import {
  installTestbedCreateBroker,
  BaseNameStub,
  RelativePathStub,
  FileContentStub,
} from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => creates .dungeonmaster config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-config' }),
      });

      const result = await StartInstall({
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

      expect(configContent).toMatch(/"framework": "node"/u);
      expect(configContent).toMatch(/"schema": "zod"/u);
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

      const result = await StartInstall({
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

      expect(configContent).toMatch(/"framework": "custom"/u);
      expect(configContent).toMatch(/"schema": "yup"/u);
    });
  });
});
