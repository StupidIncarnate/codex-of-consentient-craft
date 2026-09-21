/**
 * PURPOSE: Proxy for QuestWorkResponder. Delegates to whichever broker proxy the scenario needs —
 * `questWorkPlanWriteBrokerProxy` for `plan`/`amendment`, `questWorkRecordBrokerProxy` for the four
 * record-bearing kinds. A single test calls only ONE of the two setup methods: both brokers stage
 * `questFindQuestPathBroker` at the same address, so composing both scenarios in one test would have
 * the later registration silently win over the first.
 *
 * USAGE:
 * const proxy = QuestWorkResponderProxy();
 * proxy.setupRecordQuestFound({ quest });
 * const result = await proxy.callResponder({ questId, workItemId, payload });
 */

import type {
  AbsoluteFilePathStub,
  OperationItemIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questWorkPlanWriteBrokerProxy } from '../../../brokers/quest/work-plan-write/quest-work-plan-write-broker.proxy';
import { questWorkRecordBrokerProxy } from '../../../brokers/quest/work-record/quest-work-record-broker.proxy';
import { QuestWorkResponder } from './quest-work-responder';

type Quest = ReturnType<typeof QuestStub>;
type OperationItemId = ReturnType<typeof OperationItemIdStub>;
type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const QuestWorkResponderProxy = (): {
  callResponder: typeof QuestWorkResponder;
  setupPlanQuestFound: (params: { quest: Quest; writesOperationItemId?: OperationItemId }) => {
    questFolderPath: AbsoluteFilePath;
  };
  setupRecordQuestFound: (params: { quest: Quest }) => void;
  getPlanWritten: (params: {
    questFolderPath: AbsoluteFilePath;
    operationItemId: OperationItemId;
  }) => unknown;
  getRecordPersistedQuests: () => readonly unknown[];
} => {
  const planProxy = questWorkPlanWriteBrokerProxy();
  const recordProxy = questWorkRecordBrokerProxy();

  return {
    callResponder: QuestWorkResponder,

    setupPlanQuestFound: ({
      quest,
      writesOperationItemId,
    }: {
      quest: Quest;
      writesOperationItemId?: OperationItemId;
    }): { questFolderPath: AbsoluteFilePath } =>
      planProxy.setupQuestFound({
        quest,
        ...(writesOperationItemId === undefined ? {} : { writesOperationItemId }),
      }),

    setupRecordQuestFound: ({ quest }: { quest: Quest }): void => {
      recordProxy.setupQuestFound({ quest });
    },

    getPlanWritten: ({
      questFolderPath,
      operationItemId,
    }: {
      questFolderPath: AbsoluteFilePath;
      operationItemId: OperationItemId;
    }): unknown => planProxy.getWrittenPlan({ questFolderPath, operationItemId }),

    getRecordPersistedQuests: (): readonly unknown[] => recordProxy.getPersistedQuests(),
  };
};
