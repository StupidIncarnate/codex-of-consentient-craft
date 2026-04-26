import {
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { smoketestClearPriorQuestsBroker } from './smoketest-clear-prior-quests-broker';
import { smoketestClearPriorQuestsBrokerProxy } from './smoketest-clear-prior-quests-broker.proxy';

type GuildId = ReturnType<typeof GuildIdStub>;
type QuestId = ReturnType<typeof QuestIdStub>;

const SMOKETEST_HOME = '/home/testuser/.dungeonmaster';
const SMOKETEST_GUILD_ID: GuildId = GuildIdStub({
  value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
});
const QUESTS_PATH = `${SMOKETEST_HOME}/guilds/${SMOKETEST_GUILD_ID}/quests`;

const QUEST_DELETE_PATH_PATTERN = /\/guilds\/([^/]+)\/quests\/([^/]+)$/u;

// Each questDeleteBroker call issues an fsRm with a questFolderPath ending in
// '/guilds/<guildId>/quests/<questId>'. We extract that suffix from each
// captured rm call to verify which quests were routed to the delete broker.
const extractDeleteTargets = ({
  rmCalls,
}: {
  rmCalls: readonly unknown[][];
}): readonly { guildId: GuildId; questId: QuestId }[] =>
  rmCalls.flatMap((call) => {
    const path = String(call[0]);
    const match = QUEST_DELETE_PATH_PATTERN.exec(path);
    if (match?.[1] === undefined || match[2] === undefined) {
      return [];
    }
    return [
      {
        guildId: GuildIdStub({ value: match[1] }),
        questId: QuestIdStub({ value: match[2] }),
      },
    ];
  });

const primeGuildAndQuestsPath = ({
  proxy,
}: {
  proxy: ReturnType<typeof smoketestClearPriorQuestsBrokerProxy>;
}): void => {
  proxy.setupSmoketestGuildPresent({
    config: GuildConfigStub({
      guilds: [
        GuildStub({
          id: SMOKETEST_GUILD_ID,
          name: 'smoketests',
          path: SMOKETEST_HOME,
          createdAt: '2024-01-15T10:00:00.000Z',
        }),
      ],
    }),
    homeDir: '/home/testuser',
    homePath: FilePathStub({ value: SMOKETEST_HOME }),
    guildEntries: [
      {
        accessible: true,
        questsDirPath: FilePathStub({ value: QUESTS_PATH }),
        questDirEntries: [],
      },
    ],
  });

  proxy.setupQuestsPath({
    homeDir: '/home/testuser',
    homePath: FilePathStub({ value: SMOKETEST_HOME }),
    questsPath: FilePathStub({ value: QUESTS_PATH }),
  });
};

describe('smoketestClearPriorQuestsBroker', () => {
  describe('no prior quests', () => {
    it('VALID: {empty quests folder} => returns deletedCount 0 without calling fsRmAdapter', async () => {
      const proxy = smoketestClearPriorQuestsBrokerProxy();
      proxy.setupPassthrough();

      primeGuildAndQuestsPath({ proxy });
      proxy.setupQuestDirectoryListing({ files: [] });

      const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

      expect({
        deletedCount: result.deletedCount,
        rmCallCount: proxy.getRmCallArgs().length,
      }).toStrictEqual({
        deletedCount: 0,
        rmCallCount: 0,
      });
    });
  });

  describe('filters by questSource', () => {
    it('VALID: {3 quests, 1 matches questSource} => deletes only the matching quest and returns deletedCount 1', async () => {
      const proxy = smoketestClearPriorQuestsBrokerProxy();
      proxy.setupPassthrough();

      const questA = QuestStub({
        id: QuestIdStub({ value: 'quest-a-id' }),
        folder: '001-quest-a',
        title: 'Quest A',
        questSource: 'smoketest-mcp',
      });
      const questB = QuestStub({
        id: QuestIdStub({ value: 'quest-b-id' }),
        folder: '002-quest-b',
        title: 'Quest B',
        questSource: 'smoketest-orchestration',
      });
      const questC = QuestStub({
        id: QuestIdStub({ value: 'quest-c-id' }),
        folder: '003-quest-c',
        title: 'Quest C',
      });

      primeGuildAndQuestsPath({ proxy });
      proxy.setupQuestFolderListing({
        files: [
          FileNameStub({ value: questA.folder }),
          FileNameStub({ value: questB.folder }),
          FileNameStub({ value: questC.folder }),
        ],
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(questA) });
      proxy.setupQuestFile({ questJson: JSON.stringify(questB) });
      proxy.setupQuestFile({ questJson: JSON.stringify(questC) });

      const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

      const rmCalls = proxy.getRmCallArgs();
      const deleteTargets = extractDeleteTargets({ rmCalls });

      expect({
        deletedCount: result.deletedCount,
        rmCallCount: rmCalls.length,
        rmOptions: rmCalls.map((call) => call[1]),
        deleteTargets,
      }).toStrictEqual({
        deletedCount: 1,
        rmCallCount: 1,
        rmOptions: [{ recursive: true, force: true }],
        deleteTargets: [{ guildId: SMOKETEST_GUILD_ID, questId: questA.id }],
      });
    });

    it('VALID: {2 quests match questSource} => deletes both and returns deletedCount 2', async () => {
      const proxy = smoketestClearPriorQuestsBrokerProxy();
      proxy.setupPassthrough();

      const questA = QuestStub({
        id: QuestIdStub({ value: 'quest-a-id' }),
        folder: '001-quest-a',
        title: 'Quest A',
        questSource: 'smoketest-mcp',
      });
      const questB = QuestStub({
        id: QuestIdStub({ value: 'quest-b-id' }),
        folder: '002-quest-b',
        title: 'Quest B',
        questSource: 'smoketest-mcp',
      });

      primeGuildAndQuestsPath({ proxy });
      proxy.setupQuestFolderListing({
        files: [FileNameStub({ value: questA.folder }), FileNameStub({ value: questB.folder })],
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(questA) });
      proxy.setupQuestFile({ questJson: JSON.stringify(questB) });

      const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

      const rmCalls = proxy.getRmCallArgs();
      const deleteTargets = extractDeleteTargets({ rmCalls });

      expect({
        deletedCount: result.deletedCount,
        rmCallCount: rmCalls.length,
        rmOptions: rmCalls.map((call) => call[1]),
        deleteTargets,
      }).toStrictEqual({
        deletedCount: 2,
        rmCallCount: 2,
        rmOptions: [
          { recursive: true, force: true },
          { recursive: true, force: true },
        ],
        deleteTargets: [
          { guildId: SMOKETEST_GUILD_ID, questId: questA.id },
          { guildId: SMOKETEST_GUILD_ID, questId: questB.id },
        ],
      });
    });

    it('VALID: {2 quests, neither matches questSource} => returns deletedCount 0 without calling fsRmAdapter', async () => {
      const proxy = smoketestClearPriorQuestsBrokerProxy();
      proxy.setupPassthrough();

      const questA = QuestStub({
        id: QuestIdStub({ value: 'quest-a-id' }),
        folder: '001-quest-a',
        title: 'Quest A',
        questSource: 'smoketest-orchestration',
      });
      const questB = QuestStub({
        id: QuestIdStub({ value: 'quest-b-id' }),
        folder: '002-quest-b',
        title: 'Quest B',
      });

      primeGuildAndQuestsPath({ proxy });
      proxy.setupQuestFolderListing({
        files: [FileNameStub({ value: questA.folder }), FileNameStub({ value: questB.folder })],
      });
      proxy.setupQuestFile({ questJson: JSON.stringify(questA) });
      proxy.setupQuestFile({ questJson: JSON.stringify(questB) });

      const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

      expect({
        deletedCount: result.deletedCount,
        rmCallCount: proxy.getRmCallArgs().length,
      }).toStrictEqual({
        deletedCount: 0,
        rmCallCount: 0,
      });
    });
  });
});
