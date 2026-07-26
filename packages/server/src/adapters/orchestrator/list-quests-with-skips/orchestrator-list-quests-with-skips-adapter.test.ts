import {
  GuildIdStub,
  QuestListItemStub,
  SkippedQuestFileStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsWithSkipsAdapter } from './orchestrator-list-quests-with-skips-adapter';
import { orchestratorListQuestsWithSkipsAdapterProxy } from './orchestrator-list-quests-with-skips-adapter.proxy';

describe('orchestratorListQuestsWithSkipsAdapter', () => {
  describe('successful listing', () => {
    it('VALID: {guildId} => returns the loadable quests and the skipped quest files', async () => {
      const proxy = orchestratorListQuestsWithSkipsAdapterProxy();
      const guildId = GuildIdStub();
      const quest = QuestListItemStub();
      const skipped = SkippedQuestFileStub();
      proxy.returns({ guildId, quests: [quest], skipped: [skipped] });

      const result = await orchestratorListQuestsWithSkipsAdapter({ guildId });

      expect(result).toStrictEqual({ quests: [quest], skipped: [skipped] });
    });

    it('EMPTY: {guild with no quest folders} => returns empty quests and empty skips', async () => {
      const proxy = orchestratorListQuestsWithSkipsAdapterProxy();
      const guildId = GuildIdStub();
      proxy.returns({ guildId, quests: [], skipped: [] });

      const result = await orchestratorListQuestsWithSkipsAdapter({ guildId });

      expect(result).toStrictEqual({ quests: [], skipped: [] });
    });
  });

  describe('error handling', () => {
    it('ERROR: {orchestrator throws} => propagates the error', async () => {
      const proxy = orchestratorListQuestsWithSkipsAdapterProxy();
      const guildId = GuildIdStub();
      proxy.throws({ guildId, error: new Error('Connection failed') });

      await expect(orchestratorListQuestsWithSkipsAdapter({ guildId })).rejects.toThrow(
        /^Connection failed$/u,
      );
    });
  });
});
