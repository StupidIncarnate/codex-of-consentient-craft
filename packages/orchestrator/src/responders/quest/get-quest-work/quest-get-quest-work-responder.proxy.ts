/**
 * PURPOSE: Proxy for QuestGetQuestWorkResponder. Delegates to the two broker proxies behind its two
 * call shapes, so a scenario names the shape it is exercising rather than the mocks underneath it.
 *
 * USAGE:
 * const proxy = QuestGetQuestWorkResponderProxy();
 * proxy.setupWorkItemView({ quest, operationItemId });
 * const result = await QuestGetQuestWorkResponder({ questId, workItemId });
 */

import type { OperationItemId, QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetQuestWorkBrokerProxy } from '../../../brokers/quest/get-quest-work/quest-get-quest-work-broker.proxy';
import { questGetWorkPlanBrokerProxy } from '../../../brokers/quest/get-work-plan/quest-get-work-plan-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetQuestWorkResponderProxy = (): {
  setupWorkItemView: (params: { quest: Quest; operationItemId: OperationItemId }) => void;
  setupPlanRender: (params: { quest: Quest; operationItemId: OperationItemId }) => void;
} => {
  const viewProxy = questGetQuestWorkBrokerProxy();
  const planProxy = questGetWorkPlanBrokerProxy();

  return {
    setupWorkItemView: ({ quest, operationItemId }): void => {
      viewProxy.setupQuestWithNoPlan({ quest, operationItemId });
    },

    setupPlanRender: ({ quest, operationItemId }): void => {
      planProxy.setupPlanMissing({ quest, operationItemId });
    },
  };
};
