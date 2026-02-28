import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing config} => delegates to flow and creates config', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-delegate' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const configContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.dungeonmaster' }),
      });

      testbed.cleanup();

      expect(result.success).toBe(true);
      expect(result.action).toBe('created');
      expect(configContent).toMatch(/"framework": "node"/u);
    });
  });
});
