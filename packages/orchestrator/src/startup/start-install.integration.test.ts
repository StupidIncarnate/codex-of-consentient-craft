/**
 * PURPOSE: Integration tests for orchestrator StartInstall
 */

import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing commands} => creates commands directory with quest.md and quest:start.md', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'create-commands' }),
      });

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created .claude/commands/ with quest.md and quest:start.md',
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });

      const questStartContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest:start.md' }),
      });

      testbed.cleanup();

      expect(questContent).toMatch(/ChaosWhisperer/u);
      expect(questContent).toMatch(/BDD/u);
      expect(questStartContent).toMatch(/monitoring quest execution/u);
      expect(questStartContent).toMatch(/start-quest/u);
    });

    it('VALID: {context: existing .claude directory} => creates commands subdirectory', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'existing-claude-dir' }),
      });

      // testbed already creates .claude directory automatically

      const result = await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message: 'Created .claude/commands/ with quest.md and quest:start.md',
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });

      testbed.cleanup();

      expect(questContent).toMatch(/ChaosWhisperer/u);
    });

    it('VALID: {context: quest.md content} => contains chaoswhisperer prompt template', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-content' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });

      testbed.cleanup();

      expect(questContent).toMatch(/Socratic dialogue/u);
      expect(questContent).toMatch(/add-quest/u);
      expect(questContent).toMatch(/modify-quest/u);
      expect(questContent).toMatch(/AskUserQuestion/u);
    });

    it('VALID: {context: quest:start.md content} => contains quest start prompt template', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-start-content' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questStartContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest:start.md' }),
      });

      testbed.cleanup();

      expect(questStartContent).toMatch(/list-quests/u);
      expect(questStartContent).toMatch(/get-quest-status/u);
      expect(questStartContent).toMatch(/pathseeker/iu);
      expect(questStartContent).toMatch(/codeweaver/iu);
    });
  });
});
