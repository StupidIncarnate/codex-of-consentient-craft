/**
 * PURPOSE: Proxy for questHumanVerdictRecordBroker — composes the quest file I/O proxies
 * (find-quest-path, load, persist) plus the modify-lock layer so the broker's full
 * read-validate-write runs against real code with only the fs adapters mocked.
 *
 * USAGE:
 * const proxy = questHumanVerdictRecordBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * // ...call questHumanVerdictRecordBroker...
 * const persisted = proxy.getLastPersistedQuest();
 *
 * Date.prototype.toISOString is pinned to '2024-01-15T10:00:00.000Z' so the note's `at` stamp and
 * the quest's `updatedAt` are deterministic.
 */

import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { questHumanVerdictRecordBroker } from './quest-human-verdict-record-broker';

import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type VerdictInput = Parameters<typeof questHumanVerdictRecordBroker>[0];
type Parsed = ReturnType<typeof questContract.parse>;

registerModuleMock({ module: './quest-human-verdict-record-broker' });

const questJsonWrites = ({
  persistProxy,
}: {
  persistProxy: ReturnType<typeof questPersistBrokerProxy>;
}): readonly unknown[] =>
  persistProxy
    .getAllWrittenFiles()
    .filter(({ path }) => String(path).endsWith('quest.json.tmp'))
    .map(({ content }) => content);

export const questHumanVerdictRecordBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  getAllPersistedQuests: () => readonly Parsed[];
  getLastPersistedQuest: () => Parsed;
  // Answers one exact input without running the read-validate-write — for a caller that only
  // needs the broker's resolved `{ quest }` or its rejection. Any other input runs the real broker.
  setupResolves: (params: { input: VerdictInput; quest: Quest }) => void;
  setupRejects: (params: { input: VerdictInput; error: Error }) => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  const realMod = requireActual<{
    questHumanVerdictRecordBroker: typeof questHumanVerdictRecordBroker;
  }>({ module: './quest-human-verdict-record-broker' });
  const verdictMock = registerMock({ fn: questHumanVerdictRecordBroker });
  verdictMock.calledWith([]).implement(realMod.questHumanVerdictRecordBroker as never);

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupResolves: ({ input, quest }: { input: VerdictInput; quest: Quest }): void => {
      verdictMock.calledWith([input]).resolves({ quest });
    },

    setupRejects: ({ input, error }: { input: VerdictInput; error: Error }): void => {
      verdictMock.calledWith([input]).rejects(error);
    },

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

      // questHumanVerdictRecordBroker's own join(questPath, quest.json) -> questFilePath, addressed
      // by the exact tuple rather than an address-less FIFO slot, so it can never answer a
      // different broker's join call sharing the same underlying mocked `join`.
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
