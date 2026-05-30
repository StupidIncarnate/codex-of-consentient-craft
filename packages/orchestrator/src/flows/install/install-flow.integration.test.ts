import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { slashCommandsStatics } from '../../statics/slash-commands/slash-commands-statics';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context} => writes dumpster slash commands and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestrator-flow-commands' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const createContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-create.md' }),
      });
      const huntContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/dumpster-hunt.md' }),
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
          'Created .claude/commands/dumpster-create.md, .claude/commands/dumpster-hunt.md, and .claude/commands/dumpster-launch.md',
      });

      expect(createContent).toBe(slashCommandsStatics.dumpsterCreate.body);
      expect(huntContent).toBe(slashCommandsStatics.dumpsterHunt.body);
      expect(launchContent).toBe(slashCommandsStatics.dumpsterLaunch.body);
    });
  });
});
