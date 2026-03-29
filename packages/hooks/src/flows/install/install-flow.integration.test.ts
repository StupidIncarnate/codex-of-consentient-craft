import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context: no existing settings} => delegates to responder and creates settings', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'hooks-flow-create' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const settingsContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/settings.json' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/hooks',
        success: true,
        action: 'created',
        message: 'Created .claude/settings.json with hooks',
      });
      expect(settingsContent).toMatch(/^.*dungeonmaster.*$/mu);
    });
  });
});
