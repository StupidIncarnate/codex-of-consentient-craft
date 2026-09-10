/**
 * PURPOSE: Proxy for quest-pause-broker — two roles:
 *   1) Downstream responder tests stub the broker via setupPaused / setupNotPaused.
 *   2) The broker's own test runs the real implementation (setupPassthrough) and composes the
 *      find+load+persist proxies so the full pause flow exercises real code with only the fs
 *      boundary mocked.
 *
 * USAGE (responder test):
 * const proxy = questPauseBrokerProxy();
 * proxy.setupPaused();
 *
 * USAGE (broker test):
 * const proxy = questPauseBrokerProxy();
 * proxy.setupPassthrough();
 * proxy.setupQuestFound({ quest });
 * // ...call broker...
 * const persisted = proxy.getLastPersistedQuest();
 *
 * WHY registerModuleMock: questPauseBroker must be a mockable jest.fn() so callers in other
 * files resolve through the mocked module. calledWith/onceFor below answer by ARGUMENTS, not by
 * which file is calling, so every caller sees the same staged behaviour globally.
 *
 * WHY THESE CHILD PROXIES: the broker loads and persists quest.json directly, inside its own
 * questWithModifyLockBroker turn, rather than through questGetBroker/questModifyBroker — entering
 * the modify lock from inside a lock it already holds would deadlock. The set composed below
 * mirrors that import list, which is what `enforce-proxy-child-creation` grades.
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
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { questPauseBroker } from './quest-pause-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

registerModuleMock({ module: './quest-pause-broker' });

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;

export const questPauseBrokerProxy = (): {
  setupPaused: () => void;
  setupNotPaused: () => void;
  setupPassthrough: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => Parsed;
  getCallArgs: () => RecordedCalls;
} => {
  const mocked = registerMock({ fn: questPauseBroker });
  // questId/guildId/previousStatus vary per call but neither the stub result nor the passthrough
  // depends on which quest was paused — `[]` is the honest address for both.
  mocked.calledWith([]).resolves({ paused: true });

  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  // Writes go to quest.json.tmp then rename to quest.json, so the tmp write is the one carrying
  // the content — both suffixes count as a quest-file write.
  const questFileContents = (): readonly unknown[] =>
    persistProxy
      .getAllWrittenFiles()
      .filter(({ path }) => String(path).endsWith('quest.json') || String(path).endsWith('.tmp'))
      .map(({ content }) => content);

  return {
    setupPaused: (): void => {
      mocked.onceFor([]).resolves({ paused: true });
    },

    setupNotPaused: (): void => {
      mocked.onceFor([]).resolves({ paused: false });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{ questPauseBroker: typeof questPauseBroker }>({
        module: './quest-pause-broker',
      });
      mocked.calledWith([]).implement(realMod.questPauseBroker as never);
    },

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
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

      // pathJoin for questPauseBroker joining questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock persist (write + outbox)
      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    setupQuestNotFound: (): void => {
      // No guild holds the quest, so the walk finds no quest folder and questFindQuestPathBroker
      // throws — which questPauseBroker's own try/catch converts to { paused: false }.
      findQuestPathProxy.setupQuestNotFound({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' }),
        guilds: [],
      });
    },

    getAllPersistedContents: (): readonly unknown[] => questFileContents(),

    getLastPersistedQuest: (): Parsed => {
      const persisted = questFileContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(
        JSON.parse(typeof lastWrite === 'string' ? lastWrite : String(lastWrite)),
      );
    },

    getCallArgs: (): RecordedCalls => mocked.callsMatching([]),
  };
};
