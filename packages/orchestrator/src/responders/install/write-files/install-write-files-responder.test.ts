import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallWriteFilesResponderProxy } from './install-write-files-responder.proxy';
import { chaoswhispererPromptStatics } from '../../../statics/chaoswhisperer-prompt/chaoswhisperer-prompt-statics';
import { questStartPromptStatics } from '../../../statics/quest-start-prompt/quest-start-prompt-statics';
import { finalizerQuestAgentPromptStatics } from '../../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { gapReviewerAgentPromptStatics } from '../../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';

describe('InstallWriteFilesResponder', () => {
  describe('directory creation', () => {
    it('VALID: {context} => creates .claude/commands/ directory', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const createdDirs = proxy.getCreatedDirs();
      expect(createdDirs[0]).toBe('/project/.claude/commands');
    });

    it('VALID: {context} => creates .claude/agents/ directory', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const createdDirs = proxy.getCreatedDirs();
      expect(createdDirs[1]).toBe('/project/.claude/agents');
    });
  });

  describe('file writes', () => {
    it('VALID: {context} => writes quest.md with chaoswhisperer prompt content', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const writtenFiles = proxy.getWrittenFiles();
      expect(writtenFiles[0]).toStrictEqual({
        path: '/project/.claude/commands/quest.md',
        content: chaoswhispererPromptStatics.prompt.template,
      });
    });

    it('VALID: {context} => writes quest:start.md with quest start prompt content', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const writtenFiles = proxy.getWrittenFiles();
      expect(writtenFiles[1]).toStrictEqual({
        path: '/project/.claude/commands/quest:start.md',
        content: questStartPromptStatics.prompt.template,
      });
    });

    it('VALID: {context} => writes finalizer-quest-agent.md with finalizer prompt content', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const writtenFiles = proxy.getWrittenFiles();
      expect(writtenFiles[2]).toStrictEqual({
        path: '/project/.claude/agents/finalizer-quest-agent.md',
        content: finalizerQuestAgentPromptStatics.prompt.template,
      });
    });

    it('VALID: {context} => writes quest-gap-reviewer.md with gap reviewer prompt content', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      const writtenFiles = proxy.getWrittenFiles();
      expect(writtenFiles[3]).toStrictEqual({
        path: '/project/.claude/agents/quest-gap-reviewer.md',
        content: gapReviewerAgentPromptStatics.prompt.template,
      });
    });
  });

  describe('return value', () => {
    it('VALID: {context} => returns install result with package name and success', async () => {
      const proxy = InstallWriteFilesResponderProxy();

      const result = await proxy.callResponder({
        context: {
          targetProjectRoot: FilePathStub({ value: '/project' }),
          dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
        },
      });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/orchestrator',
        success: true,
        action: 'created',
        message:
          'Created .claude/commands/ with quest.md and quest:start.md, .claude/agents/ with finalizer-quest-agent.md and quest-gap-reviewer.md',
      });
    });
  });
});
