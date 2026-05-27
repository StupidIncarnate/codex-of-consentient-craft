import type { QuestId } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questFindBySessionIdBroker } from '../../../brokers/quest/find-by-session-id/quest-find-by-session-id-broker';
import { questFindBySessionIdBrokerProxy } from '../../../brokers/quest/find-by-session-id/quest-find-by-session-id-broker.proxy';
import { QuestFindBySessionIdResponder } from './quest-find-by-session-id-responder';

registerModuleMock({
  module: '../../../brokers/quest/find-by-session-id/quest-find-by-session-id-broker',
});

export const QuestFindBySessionIdResponderProxy = (): {
  callResponder: typeof QuestFindBySessionIdResponder;
  setupBrokerReturns: (params: { questId: QuestId | null }) => void;
} => {
  questFindBySessionIdBrokerProxy();
  const brokerMock = questFindBySessionIdBroker as jest.MockedFunction<
    typeof questFindBySessionIdBroker
  >;

  return {
    callResponder: QuestFindBySessionIdResponder,
    setupBrokerReturns: ({ questId }: { questId: QuestId | null }): void => {
      brokerMock.mockResolvedValueOnce(questId);
    },
  };
};
