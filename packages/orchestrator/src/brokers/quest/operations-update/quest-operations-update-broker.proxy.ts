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

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

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
  getAllPersistedContents: () => readonly unknown[];
  getAllPersistedQuests: () => readonly Parsed[];
  getLastPersistedQuest: () => Parsed;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

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
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock persist (write + rename + outbox)
      persistProxy.setupPersist({
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
