/**
 * PURPOSE: Proxy for QuestGetSummaryResponder. Delegates to the broker proxy for quest find/load
 * mocks.
 *
 * USAGE:
 * const proxy = QuestGetSummaryResponderProxy();
 * proxy.setupQuestFound({ quest });
 * const summary = await proxy.callResponder({ questId: 'add-auth' });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetSummaryBrokerProxy } from '../../../brokers/quest/get-summary/quest-get-summary-broker.proxy';
import { QuestGetSummaryResponder } from './quest-get-summary-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetSummaryResponderProxy = (): {
  callResponder: typeof QuestGetSummaryResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const brokerProxy = questGetSummaryBrokerProxy();

  return {
    callResponder: QuestGetSummaryResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },
  };
};
