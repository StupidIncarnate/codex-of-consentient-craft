import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { CliFlow } from './cli-flow';

describe('CliFlow', () => {
  describe('command routing', () => {
    it('VALID: {command: "init"} => routes to init responder and runs package installers', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'cli-flow-init' }),
      });

      await CliFlow({
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

      expect(packageJsonContent).toMatch(/"devDependencies"/u);
    });
  });
});
