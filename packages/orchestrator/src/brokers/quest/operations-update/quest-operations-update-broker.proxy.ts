/**
 * PURPOSE: Proxy for questOperationsUpdateBroker — composes the quest file I/O proxies
 * (find-quest-path, load, persist) plus the modify-lock layer so the broker's full
 * read-modify-write runs against real code with only the fs adapters mocked.
 *
 * USAGE:
 * const proxy = questOperationsUpdateBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * // ...call questOperationsUpdateBroker...
 * const persisted = proxy.getLastPersistedQuest();
 *
 * Date.prototype.toISOString is pinned to '2024-01-15T10:00:00.000Z' so the broker's
 * `updatedAt` stamp (and any work-item `createdAt` a caller's update callback produces via
 * new Date()) is deterministic.
 */

import { join } from '#gateway/node/path';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn, requireActual } from '@dungeonmaster/testing/register-mock';

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

const questJsonWrites = ({
  persistProxy,
}: {
  persistProxy: ReturnType<typeof questPersistBrokerProxy>;
}): readonly unknown[] =>
  persistProxy
    .getAllWrittenFiles()
    .filter(({ path }) => String(path).endsWith('quest.json.tmp'))
    .map(({ content }) => content);

export const questOperationsUpdateBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestOnDisk: (params: { quest: Quest; guildDirName?: string; folderName?: string }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Parsed[];
  getLastPersistedQuest: () => Parsed;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // The broker's own join of questPath + quest.json
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock persist (write + rename + outbox)
      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    // The same layout as setupQuestFound, with every read of the quest file answered by its exact
    // path rather than by a one-shot any path consumes. For a caller whose broker reads that one
    // file an unknown number of times — a scan, a lock, a second update — and must never have a
    // read of some other path answered with quest content.
    //
    // `guildDirName` and `folderName` default to the stub guild and the quest's own folder. A suite
    // where a sibling proxy module-mocks `questFindQuestPathBroker` to a fixed path passes that
    // path's two segments, so the reads and the persist land where the mocked lookup points.
    setupQuestOnDisk: ({
      quest,
      guildDirName = GuildIdStub(),
      folderName = quest.folder,
    }: {
      quest: Quest;
      guildDirName?: string;
      folderName?: string;
    }): void => {
      const guildId = guildDirName;
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${folderName}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${folderName}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: folderName }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // The broker's own join of questPath + quest.json
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      loadProxy.setupQuestFileAt({ questFilePath, questJson: JSON.stringify(quest) });

      // Mock persist (write + rename + outbox)
      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    getAllPersistedContents: (): readonly unknown[] => questJsonWrites({ persistProxy }),

    getAllPersistedQuests: (): readonly Parsed[] =>
      questJsonWrites({ persistProxy }).map((content) =>
        questContract.parse(JSON.parse(String(content))),
      ),

    getLastPersistedQuest: (): Parsed => {
      const writes = questJsonWrites({ persistProxy });
      const lastWrite = writes[writes.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },
  };
};
