/**
 * PURPOSE: Integration tests for orchestrator StartInstall
 */

import { installTestbedCreateBroker, BaseNameStub, RelativePathStub } from '@dungeonmaster/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { StartInstall } from './start-install';

describe('start-install integration', () => {
  describe('StartInstall', () => {
    it('VALID: {context: no existing commands} => creates commands directory with quest.md and quest:start.md, and agents directory with all agent files', async () => {
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
        message:
          'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with quest-finalizer.md, quest-path-seeker.md, and quest-gap-reviewer.md',
      });

      const questContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest.md' }),
      });

      const questStartContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/commands/quest:start.md' }),
      });

      const questFinalizerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-finalizer.md' }),
      });

      const questPathSeekerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-path-seeker.md' }),
      });

      const questGapReviewerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-gap-reviewer.md' }),
      });

      testbed.cleanup();

      expect(questContent).toMatch(/ChaosWhisperer/u);
      expect(questContent).toMatch(/BDD/u);
      expect(questStartContent).toMatch(/monitoring quest execution/u);
      expect(questStartContent).toMatch(/start-quest/u);
      expect(questFinalizerContent).toMatch(/Quest Finalizer/u);
      expect(questFinalizerContent).toMatch(/verify-quest/u);
      expect(questPathSeekerContent).toMatch(/PathSeeker/u);
      expect(questPathSeekerContent).toMatch(/observablesSatisfied/u);
      expect(questGapReviewerContent).toMatch(/Staff Engineer/u);
      expect(questGapReviewerContent).toMatch(/gap analysis/u);
    });

    it('VALID: {context: existing .claude directory} => creates commands and agents subdirectories', async () => {
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
        message:
          'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with quest-finalizer.md, quest-path-seeker.md, and quest-gap-reviewer.md',
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

    it('VALID: {context: quest-finalizer.md content} => contains finalizer agent prompt template', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-finalizer-content' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questFinalizerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-finalizer.md' }),
      });

      testbed.cleanup();

      expect(questFinalizerContent).toMatch(/Quest Finalizer/u);
      expect(questFinalizerContent).toMatch(/verify-quest/u);
      expect(questFinalizerContent).toMatch(/Deterministic Checks/u);
      expect(questFinalizerContent).toMatch(/Trace the Narrative/u);
    });

    it('VALID: {context: quest-path-seeker.md content} => contains pathseeker agent prompt template', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-path-seeker-content' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questPathSeekerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-path-seeker.md' }),
      });

      testbed.cleanup();

      expect(questPathSeekerContent).toMatch(/PathSeeker/u);
      expect(questPathSeekerContent).toMatch(/modify-quest/u);
      expect(questPathSeekerContent).toMatch(/observablesSatisfied/u);
      expect(questPathSeekerContent).toMatch(/Step Dependency Rules/u);
    });

    it('VALID: {context: quest-gap-reviewer.md content} => contains gap reviewer agent prompt template', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'quest-gap-reviewer-content' }),
      });

      await StartInstall({
        context: {
          targetProjectRoot: FilePathStub({ value: testbed.projectPath }),
          dungeonmasterRoot: FilePathStub({ value: testbed.dungeonmasterPath }),
        },
      });

      const questGapReviewerContent = testbed.readFile({
        relativePath: RelativePathStub({ value: '.claude/agents/quest-gap-reviewer.md' }),
      });

      testbed.cleanup();

      expect(questGapReviewerContent).toMatch(/Staff Engineer/u);
      expect(questGapReviewerContent).toMatch(/gap analysis/u);
      expect(questGapReviewerContent).toMatch(/Review Requirements/u);
      expect(questGapReviewerContent).toMatch(/Critical Issues/u);
    });
  });
});
