/**
 * PURPOSE: Proxy for QuestGetQaChecklistResponder. Delegates to the broker proxy for quest
 * find/load mocks.
 *
 * USAGE:
 * const proxy = QuestGetQaChecklistResponderProxy();
 * proxy.setupQuestFound({ quest });
 * const result = await proxy.callResponder({ questId: 'add-auth' });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetQaChecklistBrokerProxy } from '../../../brokers/quest/get-qa-checklist/quest-get-qa-checklist-broker.proxy';
import { QuestGetQaChecklistResponder } from './quest-get-qa-checklist-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetQaChecklistResponderProxy = (): {
  callResponder: typeof QuestGetQaChecklistResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const brokerProxy = questGetQaChecklistBrokerProxy();

  return {
    callResponder: QuestGetQaChecklistResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },
  };
};
