import {
  questContract,
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  type ExitCode,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';
import { wardDetailBrokerProxy } from '../../ward/detail/ward-detail-broker.proxy';
import { wardPersistResultBrokerProxy } from '../../ward/persist-result/ward-persist-result-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

const WARD_RESULTS_PATH = FilePathStub({ value: '/home/testuser/ward-results' });
const WARD_RESULT_FILE_PATH = FilePathStub({ value: '/home/testuser/ward-results/result.json' });
const BATCHES_DIR_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches' });
const BATCH_FILE_PATH = FilePathStub({ value: '/home/testuser/spiritmender-batches/batch.json' });

const setupFindQuestPathForDirectCall = ({
  quest,
  findProxy,
}: {
  quest: QuestInput;
  findProxy: ReturnType<typeof questFindQuestPathBrokerProxy>;
}): void => {
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

  findProxy.setupQuestFound({
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

export const runWardLayerBrokerProxy = (): {
  setupWardPass: (params: { quest: QuestInput }) => void;
  setupWardFail: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    wardDetailJson: string;
  }) => void;
  setupWardFailWithFilePaths: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    wardDetailJson: string;
    uuids: readonly [string, string, string];
  }) => void;
  setupWardFailRetryExhausted: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    wardDetailJson: string;
  }) => void;
  setupWardFailNullExit: (params: { quest: QuestInput }) => void;
  setupWardFailNoFilePaths: (params: { quest: QuestInput; exitCode: ExitCode }) => void;
  setupWardAborted: (params: { quest: QuestInput; exitCode: ExitCode }) => void;
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedWardResultExitCode: () => ExitCode | undefined;
  getInsertedWorkItems: () => readonly WorkItem[];
  getSkippedWorkItemIds: () => readonly QuestWorkItemId[];
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = spawnWardLayerBrokerProxy();
  const detailProxy = wardDetailBrokerProxy();
  const persistProxy = wardPersistResultBrokerProxy();
  questWorkItemInsertBrokerProxy();

  fsMkdirAdapterProxy();
  fsWriteFileAdapterProxy();

  // Extra pathJoin proxy for queuing values consumed by wardPersistResult and batch file writes
  const extraPathJoin = pathJoinAdapterProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  const clearEnv = (): void => {
    Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
  };

  const setupModify = ({ quest }: { quest: QuestInput }): void => {
    modifyProxy.setupQuestFound({ quest });
  };

  const setupGet = ({ quest }: { quest: QuestInput }): void => {
    getProxy.setupQuestFound({ quest });
  };

  const setupDirectFindPath = ({ quest }: { quest: QuestInput }): void => {
    setupFindQuestPathForDirectCall({ quest, findProxy });
  };

  const setupDetailFetch = ({ detailJson }: { detailJson: string }): void => {
    detailProxy.setupSuccess({ output: detailJson });
  };

  const setupDetailPersist = (): void => {
    persistProxy.setupSuccess();
  };

  const queueWardPersistPathJoins = (): void => {
    // wardPersistResultBroker calls pathJoin 2 times: wardResultsDir + filePath
    extraPathJoin.returns({ result: WARD_RESULTS_PATH });
    extraPathJoin.returns({ result: WARD_RESULT_FILE_PATH });
  };

  const queueBatchPathJoins = ({ batchCount }: { batchCount: number }): void => {
    // runWardLayerBroker calls pathJoin for: batchesDir + 1 per batch file
    extraPathJoin.returns({ result: BATCHES_DIR_PATH });
    Array.from({ length: batchCount }).forEach(() => {
      extraPathJoin.returns({ result: BATCH_FILE_PATH });
    });
  };

  const parseAllQuests = (): readonly Quest[] => {
    const persisted = modifyProxy.getAllPersistedContents();

    return persisted.map((raw) => {
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;

      return questContract.parse(parsed);
    });
  };

  return {
    setupWardPass: ({ quest }: { quest: QuestInput }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (exit 0)
      spawnProxy.setupWardSuccess({ exitCode: 0 as ExitCode });
      // 3. fetch detail
      setupDetailFetch({ detailJson: '{"checks":[]}' });
      // 4. findQuestPath (direct call for persist)
      setupDirectFindPath({ quest });
      // 5. persist detail (2 pathJoin calls from wardPersistResultBroker)
      queueWardPersistPathJoins();
      setupDetailPersist();
      // 6. modify(ward result)
      setupModify({ quest });
      // 7. modify(complete)
      setupModify({ quest });
    },

    setupWardFail: ({
      quest,
      exitCode,
      wardDetailJson,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      wardDetailJson: string;
    }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (failure)
      spawnProxy.setupWardFailure({ exitCode });
      // 3. fetch detail
      setupDetailFetch({ detailJson: wardDetailJson });
      // 4. findQuestPath (direct call for persist)
      setupDirectFindPath({ quest });
      // 5. persist detail (2 pathJoin calls from wardPersistResultBroker)
      queueWardPersistPathJoins();
      setupDetailPersist();
      // 6. modify(ward result)
      setupModify({ quest });
      // 7. modify(failed)
      setupModify({ quest });
      // 8. get(for insert)
      setupGet({ quest });
      // 9. modify(insert via questWorkItemInsertBroker)
      setupModify({ quest });
    },

    setupWardFailWithFilePaths: ({
      quest,
      exitCode,
      wardDetailJson,
      uuids,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      wardDetailJson: string;
      uuids: readonly [string, string, string];
    }): void => {
      clearEnv();
      jest
        .spyOn(crypto, 'randomUUID')
        .mockReturnValueOnce(uuids[0] as ReturnType<typeof crypto.randomUUID>)
        .mockReturnValueOnce(uuids[1] as ReturnType<typeof crypto.randomUUID>)
        .mockReturnValueOnce(uuids[2] as ReturnType<typeof crypto.randomUUID>);
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (failure)
      spawnProxy.setupWardFailure({ exitCode });
      // 3. fetch detail
      setupDetailFetch({ detailJson: wardDetailJson });
      // 4. findQuestPath (direct call for persist)
      setupDirectFindPath({ quest });
      // 5. persist detail (2 pathJoin calls from wardPersistResultBroker)
      queueWardPersistPathJoins();
      setupDetailPersist();
      // 6. modify(ward result)
      setupModify({ quest });
      // 7. modify(failed)
      setupModify({ quest });
      // 8. findQuestPath (direct call for batch writes) + batch pathJoins
      setupDirectFindPath({ quest });
      queueBatchPathJoins({ batchCount: 1 });
      // 9. get(for insert)
      setupGet({ quest });
      // 10. modify(insert via questWorkItemInsertBroker)
      setupModify({ quest });
    },

    setupWardFailRetryExhausted: ({
      quest,
      exitCode,
      wardDetailJson,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      wardDetailJson: string;
    }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (failure)
      spawnProxy.setupWardFailure({ exitCode });
      // 3. fetch detail
      setupDetailFetch({ detailJson: wardDetailJson });
      // 4. findQuestPath (direct call for persist)
      setupDirectFindPath({ quest });
      // 5. persist detail (2 pathJoin calls from wardPersistResultBroker)
      queueWardPersistPathJoins();
      setupDetailPersist();
      // 6. modify(ward result)
      setupModify({ quest });
      // 7. modify(failed)
      setupModify({ quest });
      // 8. get(exhausted check)
      setupGet({ quest });
      // 9. modify(skip pending)
      setupModify({ quest });
      // 10. get(fresh for pathseeker insert)
      setupGet({ quest });
      // 11. modify(insert pathseeker via questWorkItemInsertBroker)
      setupModify({ quest });
    },

    setupWardFailNullExit: ({ quest }: { quest: QuestInput }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn crashes (error event, exitCode 1, no runId)
      spawnProxy.setupWardNoRunId();
      // No detail fetch (no runId), no persist, no wardPersist pathJoins
      // 3. modify(ward result)
      setupModify({ quest });
      // 4. modify(failed)
      setupModify({ quest });
      // 5. get(for insert)
      setupGet({ quest });
      // 6. modify(insert via questWorkItemInsertBroker)
      setupModify({ quest });
    },

    setupWardFailNoFilePaths: ({
      quest,
      exitCode,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
    }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (failure)
      spawnProxy.setupWardFailure({ exitCode });
      // 3. fetch detail (empty checks)
      setupDetailFetch({ detailJson: '{"checks":[]}' });
      // 4. findQuestPath (direct call for persist)
      setupDirectFindPath({ quest });
      // 5. persist detail (2 pathJoin calls from wardPersistResultBroker)
      queueWardPersistPathJoins();
      setupDetailPersist();
      // 6. modify(ward result)
      setupModify({ quest });
      // 7. modify(failed)
      setupModify({ quest });
      // No batches (empty checks → no filePaths), no batch pathJoins
      // 8. get(for insert)
      setupGet({ quest });
      // 9. modify(insert via questWorkItemInsertBroker)
      setupModify({ quest });
    },

    setupWardAborted: ({ quest, exitCode }: { quest: QuestInput; exitCode: ExitCode }): void => {
      clearEnv();
      // 1. modify(session ID)
      setupModify({ quest });
      // 2. spawn ward (killed by abort, exits non-zero)
      spawnProxy.setupWardFailure({ exitCode });
      // Aborted: no further calls (no detail, no persist, no follow-ups)
    },

    getPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const quests = parseAllQuests();
      const reversed = [...quests].reverse();
      const found = reversed
        .flatMap((q) => q.workItems)
        .find((w) => w.id === workItemId && w.status !== 'in_progress');

      return found?.status;
    },

    getPersistedWardResultExitCode: (): ExitCode | undefined => {
      const quests = parseAllQuests();
      const questWithResults = quests.find((q) => q.wardResults.length > 0);

      return questWithResults?.wardResults[0]?.exitCode;
    },

    getInsertedWorkItems: (): readonly WorkItem[] => {
      const quests = parseAllQuests();
      const last = quests[quests.length - 1];

      return last ? last.workItems : [];
    },

    getSkippedWorkItemIds: (): readonly QuestWorkItemId[] => {
      const quests = parseAllQuests();

      return quests
        .flatMap((q) => q.workItems)
        .filter((w) => w.status === 'skipped')
        .map((w) => w.id)
        .filter((id, idx, arr) => arr.indexOf(id) === idx);
    },
  };
};
