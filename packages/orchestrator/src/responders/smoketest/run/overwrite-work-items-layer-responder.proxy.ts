/**
 * PURPOSE: Proxy for OverwriteWorkItemsLayerResponder — registerModuleMock so sibling layer
 * tests (notably enqueue-bundled-suite-layer-responder.test.ts) can stub it without driving
 * the file-system chain. The responder's own test calls setupPassthrough.
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  type QuestStub,
} from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../../../brokers/quest/persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../../brokers/quest/with-modify-lock/quest-with-modify-lock-broker.proxy';
import { OverwriteWorkItemsLayerResponder } from './overwrite-work-items-layer-responder';

registerModuleMock({ module: './overwrite-work-items-layer-responder' });

type Quest = ReturnType<typeof QuestStub>;

export const OverwriteWorkItemsLayerResponderProxy = (): {
  reset: () => void;
  setupSucceeds: () => void;
  setupRejects: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestFoundWithWriteFailure: (params: { quest: Quest; error: Error }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getCallArgs: () => readonly unknown[][];
} => {
  const pathJoinProxy = pathJoinAdapterProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  const mocked = OverwriteWorkItemsLayerResponder as jest.MockedFunction<
    typeof OverwriteWorkItemsLayerResponder
  >;
  mocked.mockResolvedValue({ success: true });

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupSucceeds: (): void => {
      mocked.mockResolvedValueOnce({ success: true });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        OverwriteWorkItemsLayerResponder: typeof OverwriteWorkItemsLayerResponder;
      }>({ module: './overwrite-work-items-layer-responder' });
      mocked.mockImplementation(realMod.OverwriteWorkItemsLayerResponder);
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

      pathJoinProxy.returns({ result: questFilePath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      persistProxy.setupPersist({
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },
    setupQuestFoundWithWriteFailure: ({ quest, error }: { quest: Quest; error: Error }): void => {
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

      pathJoinProxy.returns({ result: questFilePath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });
      // Reject write without stubbing the success path — the write failure must propagate.
      persistProxy.setupWriteFailure({ error });
    },
    getAllPersistedContents: (): readonly unknown[] =>
      persistProxy
        .getAllWrittenFiles()
        .filter(({ path }) => {
          const pathStr = String(path);
          return pathStr.endsWith('quest.json') || pathStr.endsWith('quest.json.tmp');
        })
        .map(({ content }) => content),
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
