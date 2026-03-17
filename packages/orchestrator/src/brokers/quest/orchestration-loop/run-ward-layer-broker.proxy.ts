import {
  questContract,
  type ExitCode,
  type Quest,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

type QuestShape = ReturnType<typeof QuestStub>;

const parseContent = (raw: unknown): Quest => {
  const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
  return questContract.parse(parsed);
};

export const runWardLayerBrokerProxy = (): {
  setupWardPass: (params: { quest: QuestShape }) => void;
  setupWardFailWithRetry: (params: { quest: QuestShape; exitCode: ExitCode }) => void;
  setupWardFailNoRetry: (params: { quest: QuestShape; exitCode: ExitCode }) => void;
  setupWardFailWithWardResult: (params: {
    quest: QuestShape;
    exitCode: ExitCode;
    wardResultJson: string;
  }) => void;
  setupDeterministicUuids: (params: { uuids: readonly string[] }) => void;
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedQuestAt: (params: { index: Quest['wardResults']['length'] }) => Quest;
  getAllPersistedQuests: () => readonly Quest[];
  getAllPersistedContents: () => readonly unknown[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const wardProxy = spawnWardLayerBrokerProxy();
  const insertProxy = questWorkItemInsertBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  const getAllParsed = (): readonly Quest[] =>
    modifyProxy.getAllPersistedContents().map((raw) => parseContent(raw));

  return {
    setupWardPass: ({ quest }: { quest: QuestShape }): void => {
      wardProxy.setupWardSuccess({
        exitCode: 0 as ExitCode,
        wardResultJson: '{"checks":[]}',
      });
      modifyProxy.setupQuestFound({ quest });
    },

    setupWardFailWithRetry: ({
      quest,
      exitCode,
    }: {
      quest: QuestShape;
      exitCode: ExitCode;
    }): void => {
      wardProxy.setupWardNoRunId({ exitCode });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      insertProxy.setupQuestModify({ quest });
    },

    setupWardFailNoRetry: ({
      quest,
      exitCode,
    }: {
      quest: QuestShape;
      exitCode: ExitCode;
    }): void => {
      wardProxy.setupWardNoRunId({ exitCode });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
    },

    setupWardFailWithWardResult: ({
      quest,
      exitCode,
      wardResultJson,
    }: {
      quest: QuestShape;
      exitCode: ExitCode;
      wardResultJson: string;
    }): void => {
      wardProxy.setupWardFailure({ exitCode, wardResultJson });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    getLastPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const quests = getAllParsed();
      const last = quests[quests.length - 1];
      if (!last) return undefined;
      const item = last.workItems.find((wi) => wi.id === workItemId);
      return item?.status;
    },

    getPersistedQuestAt: ({ index }: { index: Quest['wardResults']['length'] }): Quest => {
      const quests = getAllParsed();
      const quest = quests[index];
      if (!quest) throw new Error(`No persisted quest at index ${String(index)}`);
      return quest;
    },

    getAllPersistedQuests: (): readonly Quest[] => getAllParsed(),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    setupDeterministicUuids: ({ uuids }: { uuids: readonly string[] }): void => {
      const spy = jest.spyOn(crypto, 'randomUUID');
      for (const uuid of uuids) {
        spy.mockReturnValueOnce(uuid as ReturnType<typeof crypto.randomUUID>);
      }
    },
  };
};
