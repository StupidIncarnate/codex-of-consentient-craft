import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartCli } from './start-cli';

describe('StartCli', () => {
  describe('delegation to CLI flow', () => {
    it('VALID: {command: "init"} => delegates to CliFlow which runs init responder', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-cli-init' }),
      });

      await StartCli({
        command: 'init',
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const packageJsonContent = testbed.readFile({
        relativePath: RelativePathStub({ value: 'package.json' }),
      });

      testbed.cleanup();

      expect(packageJsonContent).toMatch(/^\s*"devDependencies": \{$/mu);
    });
  });
});
