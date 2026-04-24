/**
 * PURPOSE: Proxy for LoadQuestLayerResponder — registerModuleMock so sibling enqueue-* layer
 * responder tests can inject a known Quest without driving the file-system chain.
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../../brokers/quest/load/quest-load-broker.proxy';
import { LoadQuestLayerResponder } from './load-quest-layer-responder';

registerModuleMock({ module: './load-quest-layer-responder' });

type Quest = ReturnType<typeof QuestStub>;

export const LoadQuestLayerResponderProxy = (): {
  reset: () => void;
  setupReturnsQuest: (params: { quest: Quest }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  pathJoinAdapterProxy();
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();

  const mocked = LoadQuestLayerResponder as jest.MockedFunction<typeof LoadQuestLayerResponder>;

  return {
    reset: (): void => {
      // Child proxies self-reset via jest.clearAllMocks between tests.
    },
    setupReturnsQuest: ({ quest }: { quest: Quest }): void => {
      mocked.mockResolvedValueOnce(quest);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual({ module: './load-quest-layer-responder' });
      const realImpl = Reflect.get(
        realMod as object,
        'LoadQuestLayerResponder',
      ) as typeof LoadQuestLayerResponder;
      mocked.mockImplementation(realImpl);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
