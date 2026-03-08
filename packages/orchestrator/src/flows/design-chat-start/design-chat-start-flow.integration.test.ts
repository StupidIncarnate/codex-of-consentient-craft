import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { DesignChatStartFlow } from './design-chat-start-flow';

describe('DesignChatStartFlow', () => {
  describe('export', () => {
    it('VALID: DesignChatStartFlow => exports an async function', () => {
      expect(typeof DesignChatStartFlow).toBe('function');
    });
  });

  describe('delegation to responder', () => {
    it('ERROR: {guildId: nonexistent, questId, message} => throws guild not found', async () => {
      const guildId = GuildIdStub({ value: '00000000-0000-0000-0000-000000000000' });
      const questId = QuestIdStub({ value: 'test-quest' });

      await expect(
        DesignChatStartFlow({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Guild not found/u);
    });
  });
});
