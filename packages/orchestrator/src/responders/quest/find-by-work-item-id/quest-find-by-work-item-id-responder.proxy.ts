import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questFindByWorkItemIdBroker } from '../../../brokers/quest/find-by-work-item-id/quest-find-by-work-item-id-broker';
import { questFindByWorkItemIdBrokerProxy } from '../../../brokers/quest/find-by-work-item-id/quest-find-by-work-item-id-broker.proxy';
import { QuestFindByWorkItemIdResponder } from './quest-find-by-work-item-id-responder';

registerModuleMock({
  module: '../../../brokers/quest/find-by-work-item-id/quest-find-by-work-item-id-broker',
});

export const QuestFindByWorkItemIdResponderProxy = (): {
  callResponder: typeof QuestFindByWorkItemIdResponder;
  setupBrokerReturns: (params: { questId: QuestId | null }) => void;
} => {
  questFindByWorkItemIdBrokerProxy();
  const brokerMock = questFindByWorkItemIdBroker as jest.MockedFunction<
    typeof questFindByWorkItemIdBroker
  >;

  return {
    callResponder: QuestFindByWorkItemIdResponder,
    setupBrokerReturns: ({ questId }: { questId: QuestId | null }): void => {
      brokerMock.mockResolvedValueOnce(questId);
    },
  };
};
