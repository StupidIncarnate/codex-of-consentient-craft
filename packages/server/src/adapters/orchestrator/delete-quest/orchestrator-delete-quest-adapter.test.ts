import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorDeleteQuestAdapter } from './orchestrator-delete-quest-adapter';
import { orchestratorDeleteQuestAdapterProxy } from './orchestrator-delete-quest-adapter.proxy';

describe('orchestratorDeleteQuestAdapter', () => {
  describe('successful delete', () => {
    it('VALID: {questId, guildId} => returns deleted result', async () => {
      orchestratorDeleteQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const result = await orchestratorDeleteQuestAdapter({ questId, guildId });

      expect(result).toStrictEqual({ deleted: true });
    });

    it('VALID: {questId, guildId} => forwards exact args to orchestrator', async () => {
      const proxy = orchestratorDeleteQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'forwarded-quest-xyz' });
      const guildId = GuildIdStub({ value: '550e8400-e29b-41d4-a716-446655440000' });

      await orchestratorDeleteQuestAdapter({ questId, guildId });

      expect(proxy.getLastCalledArgs()).toStrictEqual({ questId, guildId });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorDeleteQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.throws({ error: new Error('Failed to delete quest') });

      await expect(orchestratorDeleteQuestAdapter({ questId, guildId })).rejects.toThrow(
        /Failed to delete quest/u,
      );
    });
  });
});
