import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gapReviewerAgentPromptStatics } from '../../../statics/gap-reviewer-agent-prompt/gap-reviewer-agent-prompt-statics';
import { finalizerQuestAgentPromptStatics } from '../../../statics/finalizer-quest-agent-prompt/finalizer-quest-agent-prompt-statics';
import { agentFilesEnsureBroker } from './agent-files-ensure-broker';
import { agentFilesEnsureBrokerProxy } from './agent-files-ensure-broker.proxy';

describe('agentFilesEnsureBroker', () => {
  describe('writes agent files', () => {
    it('VALID: {targetPath} => creates .claude/agents/ directory', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await agentFilesEnsureBroker({ targetPath });

      const createdDirs = proxy.getCreatedDirs();

      expect(createdDirs).toStrictEqual(['/home/user/my-project/.claude/agents']);
    });

    it('VALID: {targetPath} => writes quest-gap-reviewer.md from statics', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await agentFilesEnsureBroker({ targetPath });

      const writtenFiles = proxy.getAllWrittenFiles();
      const gapReviewer = writtenFiles.find(
        (f) => f.path === '/home/user/my-project/.claude/agents/quest-gap-reviewer.md',
      );

      expect(gapReviewer).toStrictEqual({
        path: '/home/user/my-project/.claude/agents/quest-gap-reviewer.md',
        content: gapReviewerAgentPromptStatics.prompt.template,
      });
    });

    it('VALID: {targetPath} => writes finalizer-quest-agent.md from statics', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await agentFilesEnsureBroker({ targetPath });

      const writtenFiles = proxy.getAllWrittenFiles();
      const finalizer = writtenFiles.find(
        (f) => f.path === '/home/user/my-project/.claude/agents/finalizer-quest-agent.md',
      );

      expect(finalizer).toStrictEqual({
        path: '/home/user/my-project/.claude/agents/finalizer-quest-agent.md',
        content: finalizerQuestAgentPromptStatics.prompt.template,
      });
    });

    it('VALID: {targetPath} => writes exactly two files', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await agentFilesEnsureBroker({ targetPath });

      const writtenFiles = proxy.getAllWrittenFiles();

      expect(writtenFiles).toStrictEqual([
        {
          path: '/home/user/my-project/.claude/agents/quest-gap-reviewer.md',
          content: gapReviewerAgentPromptStatics.prompt.template,
        },
        {
          path: '/home/user/my-project/.claude/agents/finalizer-quest-agent.md',
          content: finalizerQuestAgentPromptStatics.prompt.template,
        },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {mkdir fails} => propagates error', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      proxy.setupMkdirThrows({ error: new Error('EACCES: permission denied') });
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await expect(agentFilesEnsureBroker({ targetPath })).rejects.toThrow(
        /EACCES: permission denied/u,
      );
    });

    it('ERROR: {write fails} => propagates error', async () => {
      const proxy = agentFilesEnsureBrokerProxy();
      proxy.enableRealImplementation();
      proxy.setupWriteThrows({ error: new Error('ENOSPC: no space left on device') });
      const targetPath = AbsoluteFilePathStub({ value: '/home/user/my-project' });

      await expect(agentFilesEnsureBroker({ targetPath })).rejects.toThrow(
        /ENOSPC: no space left on device/u,
      );
    });
  });
});
