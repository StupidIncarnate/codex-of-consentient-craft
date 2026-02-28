import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('StartInstall', () => {
  describe('wiring to install flow', () => {
    it('VALID: {context} => delegates to flow and returns install result with all files created', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'startup-wiring' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.guildPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });
      const questStartContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest:start.md' }),
      });
      const questFinalizerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/finalizer-quest-agent.md' }),
      });
      const questGapReviewerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-gap-reviewer.md' }),
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
      expect(questStartContent).toMatch(/monitoring quest execution/u);
      expect(questFinalizerContent).toMatch(/Quest Finalizer/u);
      expect(questGapReviewerContent).toMatch(/Staff Engineer/u);
    });
  });
});
