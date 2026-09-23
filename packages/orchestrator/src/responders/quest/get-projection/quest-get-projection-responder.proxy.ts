/**
 * PURPOSE: Proxy for QuestGetProjectionResponder. Delegates to the broker proxy for quest
 * find/load mocks.
 *
 * USAGE:
 * const proxy = QuestGetProjectionResponderProxy();
 * proxy.setupQuestFound({ quest });
 * const projection = await proxy.callResponder({ questId: 'add-auth' });
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetProjectionBrokerProxy } from '../../../brokers/quest/get-projection/quest-get-projection-broker.proxy';
import { QuestGetProjectionResponder } from './quest-get-projection-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestGetProjectionResponderProxy = (): {
  callResponder: typeof QuestGetProjectionResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
} => {
  const brokerProxy = questGetProjectionBrokerProxy();

  return {
    callResponder: QuestGetProjectionResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      brokerProxy.setupQuestNotFound();
    },
  };
};
