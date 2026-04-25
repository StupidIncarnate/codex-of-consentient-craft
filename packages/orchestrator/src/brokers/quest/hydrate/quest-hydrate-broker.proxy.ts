/**
 * PURPOSE: Proxy for quest-hydrate-broker — registerModuleMock so layer-responder tests can stub
 * the broker without driving the full file-system chain. The integration test for hydrate itself
 * runs against the real adapters and never imports this proxy.
 *
 * USAGE (downstream layer test):
 * const proxy = questHydrateBrokerProxy();
 * proxy.setupReturnsQuestId({ questId });
 * // ...call layer responder under test...
 * const calls = proxy.getCallArgs();
 *
 * WHY registerModuleMock: layer responders import questHydrateBroker by name. Module-level mocking
 * matches the questPauseBroker / questModifyBroker pattern.
 */

import type { QuestIdStub } from '@dungeonmaster/shared/contracts';
import { questIdContract } from '@dungeonmaster/shared/contracts';
import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { questHydrateBroker } from './quest-hydrate-broker';
import { questCreateBrokerProxy } from '../create/quest-create-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { buildHydrateInputLayerBrokerProxy } from './build-hydrate-input-layer-broker.proxy';

registerModuleMock({ module: './quest-hydrate-broker' });

type QuestId = ReturnType<typeof QuestIdStub>;

const DEFAULT_QUEST_ID = questIdContract.parse('hydrated-quest');

export const questHydrateBrokerProxy = (): {
  setupReturnsQuestId: (params: { questId: QuestId }) => void;
  setupRejects: (params: { error: Error }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  questCreateBrokerProxy();
  questLoadBrokerProxy();
  questModifyBrokerProxy();
  questPersistBrokerProxy();
  buildHydrateInputLayerBrokerProxy();

  const mocked = questHydrateBroker as jest.MockedFunction<typeof questHydrateBroker>;
  // Default: resolve with a known-good questId so callers don't need to set it up explicitly.
  mocked.mockResolvedValue({ questId: DEFAULT_QUEST_ID });

  return {
    setupReturnsQuestId: ({ questId }: { questId: QuestId }): void => {
      mocked.mockResolvedValueOnce({ questId });
    },
    setupRejects: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
