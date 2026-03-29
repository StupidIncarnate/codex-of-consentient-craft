import {
  questContract,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runSpiritmenderLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest; batchContents?: readonly string[] }) => void;
  setupQuestNotFound: () => void;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnce: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnOnceLazy: () => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const extraPathJoin = pathJoinAdapterProxy();
  const modifyProxy = questModifyBrokerProxy();
  const slotProxy = slotManagerOrchestrateBrokerProxy();
  const stderrSpy: { current: SpyOnHandle | null } = { current: null };

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

  const setupFindQuestPath = ({ quest }: { quest: Quest }): void => {
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
  };

  return {
    setupQuestFound: ({
      quest,
      batchContents,
    }: {
      quest: Quest;
      batchContents?: readonly string[];
    }): void => {
      // Step 1: findQuestPath (direct call for batch dir)
      setupFindQuestPath({ quest });

      // Step 2-3: pathJoin for batchesDir and batch files
      // These pathJoin calls consume from the shared queue, so we must queue them
      // to prevent consuming values intended for the modify call below
      const batchCount = batchContents ? batchContents.length : 1;
      extraPathJoin.returns({
        result: FilePathStub({ value: '/home/testuser/spiritmender-batches' }),
      });
      Array.from({ length: batchCount }).forEach(() => {
        extraPathJoin.returns({
          result: FilePathStub({ value: '/home/testuser/spiritmender-batches/batch.json' }),
        });
      });

      if (batchContents) {
        for (const content of batchContents) {
          readFileProxy.resolves({ content });
        }
      } else {
        // No batch contents — simulate ENOENT for each work item's batch file read
        readFileProxy.rejects({ error: new Error('ENOENT: no such file or directory') });
      }

      // Step 5: questModifyBroker (status update) — internally calls findQuestPath
      modifyProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' }),
      });
    },
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
    setupSpawnOnce: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotProxy.setupSpawnOnce({ lines, exitCode });
    },
    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotProxy.setupSpawnAutoLines({ lines, exitCode });
    },
    setupSpawnOnceLazy: (): void => {
      slotProxy.setupSpawnOnceLazy();
    },
    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): void => {
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      stderrSpy.current = handle;
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrSpy.current?.mock.calls.map((call: readonly unknown[]) => call[0]) ?? [],

    getLastPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const lastQuest = questContract.parse(parsed);
      const item = lastQuest.workItems.find((wi) => wi.id === workItemId);
      return item?.status;
    },
  };
};
