import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { DesignChatStartFlow } from './design-chat-start-flow';

describe('DesignChatStartFlow', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('export', () => {
    it('VALID: DesignChatStartFlow => exports an async function', () => {
      expect(DesignChatStartFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('delegation to responder', () => {
    // A design chat is quest-scoped: the spawn resolves the quest (and, through it, the worktree
    // it runs in) before the guild is used for anything, so an unknown quest is the first thing
    // that can fail and its message is what reaches the caller.
    it('ERROR: {guildId: nonexistent, questId: nonexistent, message} => throws quest not found', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'design-chat-1' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const questId = QuestIdStub({ value: 'test-quest' });
      const error = await DesignChatStartFlow({
        guildId,
        questId,
        message: 'Create prototype',
      }).catch((thrown: unknown) => thrown);

      restore();

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Quest not found: test-quest');
    });
  });
});
