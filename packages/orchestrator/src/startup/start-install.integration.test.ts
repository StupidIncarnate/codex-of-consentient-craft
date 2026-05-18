import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { slashCommandsStatics } from '../statics/slash-commands/slash-commands-statics';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow, writes commands, and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-start-install' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const createContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-create.md' }),
      });
      const launchContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-launch.md' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/dumpster-create.md and .claude/commands/dumpster-launch.md',
      });

      expect(createContent).toBe(slashCommandsStatics.dumpsterCreate.body);
      expect(launchContent).toBe(slashCommandsStatics.dumpsterLaunch.body);
    });
  });
});
