import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { matchCandidatesLayerBroker } from './match-candidates-layer-broker';
import { matchCandidatesLayerBrokerProxy } from './match-candidates-layer-broker.proxy';

const GUILD_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GUILD_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('matchCandidatesLayerBroker', () => {
  describe('a candidate carries the id', () => {
    it('VALID: {one candidate whose file records the id} => returns its folder path and guild id', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });

      proxy.setupCandidateFile({
        questFilePath,
        contents: FileContentsStub({
          value: JSON.stringify(QuestStub({ id: 'add-auth', folder: 'q' })),
        }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId,
      });

      expect(result).toStrictEqual({
        questPath: `/home/guilds/${GUILD_A}/quests/q`,
        guildId: GUILD_A,
      });
    });

    it('VALID: {second candidate carries the id, first does not} => returns the second', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'fix-bug' });
      const firstFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/a/quest.json` });
      const secondFilePath = FilePathStub({ value: `/home/guilds/${GUILD_B}/quests/b/quest.json` });

      proxy.setupCandidateFile({
        questFilePath: firstFilePath,
        contents: FileContentsStub({
          value: JSON.stringify(QuestStub({ id: 'add-auth', folder: 'a' })),
        }),
      });
      proxy.setupCandidateFile({
        questFilePath: secondFilePath,
        contents: FileContentsStub({
          value: JSON.stringify(QuestStub({ id: 'fix-bug', folder: 'b' })),
        }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath: firstFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/a` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
          {
            questFilePath: secondFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_B}/quests/b` }),
            guildDirName: FileNameStub({ value: GUILD_B }),
          },
        ],
        questId,
      });

      expect(result).toStrictEqual({
        questPath: `/home/guilds/${GUILD_B}/quests/b`,
        guildId: GUILD_B,
      });
    });

    it('VALID: {file carries the id but fails the full questContract} => still returns its path', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });
      // A hand-edited month-13 createdAt rejects the WHOLE file under questContract. Matching on
      // the id alone is what lets the caller's own load name the bad field, instead of the quest
      // that most needs diagnosing reporting as "not found in any guild".
      const unloadable = JSON.stringify(QuestStub({ id: 'add-auth', folder: 'q' })).replace(
        '"comments":[]',
        '"comments":[{"id":"c0e3e17a-58cc-4372-a567-0e02b2c3d479","flowId":"login-flow","nodeId":"start","text":"hand-edited","createdAt":"2026-13-01T00:00:00.000Z"}]',
      );

      proxy.setupCandidateFile({
        questFilePath,
        contents: FileContentsStub({ value: unloadable }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId,
      });

      expect(result).toStrictEqual({
        questPath: `/home/guilds/${GUILD_A}/quests/q`,
        guildId: GUILD_A,
      });
    });
  });

  describe('no candidate carries the id', () => {
    it('EMPTY: {no candidates} => returns null', async () => {
      matchCandidatesLayerBrokerProxy();

      const result = await matchCandidatesLayerBroker({
        candidates: [],
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toBe(null);
    });

    it('VALID: {candidate records a different id} => returns null', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });

      proxy.setupCandidateFile({
        questFilePath,
        contents: FileContentsStub({
          value: JSON.stringify(QuestStub({ id: 'add-auth', folder: 'q' })),
        }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId: QuestIdStub({ value: 'nonexistent' }),
      });

      expect(result).toBe(null);
    });

    it('ERROR: {candidate file cannot be read} => skips it and returns null', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });

      proxy.setupUnreadableCandidateFile({
        questFilePath,
        error: new Error('EACCES: permission denied'),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toBe(null);
    });

    it('ERROR: {candidate file is not valid JSON} => skips it and returns null', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });

      proxy.setupCandidateFile({
        questFilePath,
        contents: FileContentsStub({ value: '{ not json }' }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toBe(null);
    });

    it('ERROR: {candidate file is JSON with no id} => skips it and returns null', async () => {
      const proxy = matchCandidatesLayerBrokerProxy();
      const questFilePath = FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q/quest.json` });

      proxy.setupCandidateFile({
        questFilePath,
        contents: FileContentsStub({ value: '{"title":"no id here"}' }),
      });

      const result = await matchCandidatesLayerBroker({
        candidates: [
          {
            questFilePath,
            questFolderPath: FilePathStub({ value: `/home/guilds/${GUILD_A}/quests/q` }),
            guildDirName: FileNameStub({ value: GUILD_A }),
          },
        ],
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toBe(null);
    });
  });
});
