/**
 * PURPOSE: Proxy for QuestResetFlowSignoffsResponder. Delegates to the broker proxy for quest
 * find/load/persist and the fixed-timestamp pin.
 *
 * USAGE:
 * const proxy = QuestResetFlowSignoffsResponderProxy();
 * proxy.setupQuestFound({ quest });
 * const result = await proxy.callResponder({ questId, workItemId, flowId, reason });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questResetFlowSignoffsBrokerProxy } from '../../../brokers/quest/reset-flow-signoffs/quest-reset-flow-signoffs-broker.proxy';
import { QuestResetFlowSignoffsResponder } from './quest-reset-flow-signoffs-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestResetFlowSignoffsResponderProxy = (): {
  callResponder: typeof QuestResetFlowSignoffsResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  const brokerProxy = questResetFlowSignoffsBrokerProxy();

  return {
    callResponder: QuestResetFlowSignoffsResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },

    getPersistedQuests: (): readonly unknown[] => brokerProxy.getPersistedQuests(),
  };
};
