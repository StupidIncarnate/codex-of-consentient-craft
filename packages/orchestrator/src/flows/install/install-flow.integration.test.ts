import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from './install-flow';

describe('InstallFlow', () => {
  describe('delegation to responder', () => {
    it('VALID: {context} => delegates to write-files responder and returns install result', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'flow-delegation' }),
      });

      const result = await InstallFlow({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });

      testbed.cleanup();

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with finalizer-quest-agent.md and quest-gap-reviewer.md',
      });
      expect(questContent).toMatch(/ChaosWhisperer/u);
    });
  });
});
