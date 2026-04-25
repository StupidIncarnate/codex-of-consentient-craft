import {
  AbsoluteFilePathStub,
  GuildIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { loadQuestByIdLayerBroker } from './load-quest-by-id-layer-broker';
import { loadQuestByIdLayerBrokerProxy } from './load-quest-by-id-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'load-layer-quest' });
const QUEST_PATH = AbsoluteFilePathStub({
  value:
    '/home/testuser/.dungeonmaster/guilds/11111111-1111-1111-1111-111111111111/quests/load-layer-quest',
});
const GUILD_ID = GuildIdStub({ value: '11111111-1111-1111-1111-111111111111' });

describe('loadQuestByIdLayerBroker', () => {
  describe('successful load', () => {
    it('VALID: {quest found and readable} => returns parsed Quest', async () => {
      const proxy = loadQuestByIdLayerBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID });
      proxy.setupLoaded({ questPath: QUEST_PATH, guildId: GUILD_ID, quest });

      const result = await loadQuestByIdLayerBroker({ questId: QUEST_ID });

      expect(result).toStrictEqual(quest);
    });
  });

  describe('find throws', () => {
    it('ERROR: {quest path not found} => propagates the error', async () => {
      const proxy = loadQuestByIdLayerBrokerProxy();
      proxy.setupFindThrows({ error: new QuestNotFoundError({ questId: 'X' }) });

      await expect(loadQuestByIdLayerBroker({ questId: QUEST_ID })).rejects.toThrow(
        /not found in any guild/u,
      );
    });
  });

  describe('load throws', () => {
    it('ERROR: {quest file unreadable} => propagates the error', async () => {
      const proxy = loadQuestByIdLayerBrokerProxy();
      const quest = QuestStub({ id: QUEST_ID });
      proxy.setupLoadThrows({
        questPath: QUEST_PATH,
        guildId: GUILD_ID,
        quest,
        error: new Error('EACCES: permission denied'),
      });

      // fsReadFileAdapter wraps the underlying error so the surface message is
      // "Failed to read file at ...". That's the contract this layer preserves.
      await expect(loadQuestByIdLayerBroker({ questId: QUEST_ID })).rejects.toThrow(
        /Failed to read file/u,
      );
    });
  });
});
