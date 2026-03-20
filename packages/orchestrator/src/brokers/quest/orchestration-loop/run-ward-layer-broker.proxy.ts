import {
  questContract,
  type ExitCode,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

type QuestInput = ReturnType<typeof QuestStub>;

export const runWardLayerBrokerProxy = (): {
  setupWardPass: (params: { quest: QuestInput }) => void;
  setupWardFail: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    wardResultJson: string;
  }) => void;
  setupWardFailRetryExhausted: (params: {
    quest: QuestInput;
    exitCode: ExitCode;
    wardResultJson: string;
  }) => void;
  setupWardFailNullExit: (params: { quest: QuestInput }) => void;
  setupWardFailNoFilePaths: (params: { quest: QuestInput; exitCode: ExitCode }) => void;
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedWardResultExitCode: () => ExitCode | undefined;
  getInsertedWorkItems: () => readonly WorkItem[];
  getSkippedWorkItemIds: () => readonly QuestWorkItemId[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = spawnWardLayerBrokerProxy();
  questWorkItemInsertBrokerProxy();

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
      spawnProxy.setupWardSuccess({
        exitCode: 0 as ExitCode,
        wardResultJson: '{"checks":[]}',
      });
      // Pass: modify(mark complete)
      setupModify({ quest });
    },

    setupWardFail: ({
      quest,
      exitCode,
      wardResultJson,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      wardResultJson: string;
    }): void => {
      clearEnv();
      spawnProxy.setupWardFailure({ exitCode, wardResultJson });
      // Fail w/ filePaths + retries: modify(wardResult), modify(failed), get(insert), modify(insert)
      setupModify({ quest });
      setupModify({ quest });
      setupGet({ quest });
      setupModify({ quest });
    },

    setupWardFailRetryExhausted: ({
      quest,
      exitCode,
      wardResultJson,
    }: {
      quest: QuestInput;
      exitCode: ExitCode;
      wardResultJson: string;
    }): void => {
      clearEnv();
      spawnProxy.setupWardFailure({ exitCode, wardResultJson });
      // Exhausted: modify(wardResult), modify(failed), get(exhausted), modify(skip), get(fresh), modify(insert)
      setupModify({ quest });
      setupModify({ quest });
      setupGet({ quest });
      setupModify({ quest });
      setupGet({ quest });
      setupModify({ quest });
    },

    setupWardFailNullExit: ({ quest }: { quest: QuestInput }): void => {
      clearEnv();
      spawnProxy.setupWardNoRunId({ exitCode: null as unknown as ExitCode });
      // Null exit, no wardResult filePaths: get(fallback), modify(wardResult), modify(failed), get(insert), modify(insert)
      setupGet({ quest });
      setupModify({ quest });
      setupModify({ quest });
      setupGet({ quest });
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
      spawnProxy.setupWardFailure({ exitCode, wardResultJson: '{"checks":[]}' });
      // No filePaths from ward output: get(fallback), modify(wardResult), modify(failed), get(insert), modify(insert)
      setupGet({ quest });
      setupModify({ quest });
      setupModify({ quest });
      setupGet({ quest });
      setupModify({ quest });
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
