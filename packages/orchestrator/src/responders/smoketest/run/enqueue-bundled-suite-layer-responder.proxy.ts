/**
 * PURPOSE: Proxy for EnqueueBundledSuiteLayerResponder — registerModuleMock so sibling tests
 * (smoketest-run-responder) can stub the bundled-suite path without driving its full chain.
 * The responder's own test calls setupPassthrough.
 */

import type { QuestId, QuestStub as QuestStubType, UrlSlug } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questHydrateBrokerProxy } from '../../../brokers/quest/hydrate/quest-hydrate-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';
import { EnqueueBundledSuiteLayerResponder } from './enqueue-bundled-suite-layer-responder';
import { LoadQuestLayerResponderProxy } from './load-quest-layer-responder.proxy';
import { OverwriteWorkItemsLayerResponderProxy } from './overwrite-work-items-layer-responder.proxy';

registerModuleMock({ module: './enqueue-bundled-suite-layer-responder' });

type Quest = ReturnType<typeof QuestStubType>;

export const EnqueueBundledSuiteLayerResponderProxy = (): {
  reset: () => void;
  setupReturnsRecord: (params: { record: { questId: QuestId; guildSlug: UrlSlug } }) => void;
  setupReturnsNull: () => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
  getHydrateBrokerCallArgs: () => readonly unknown[][];
  setupHydrateReturnsQuestId: (params: { questId: QuestId }) => void;
  setupLoadQuestReturns: (params: { quest: Quest }) => void;
} => {
  const hydrateProxy = questHydrateBrokerProxy();
  const queueProxy = questExecutionQueueStateProxy();
  const listenerProxy = smoketestListenerStateProxy();
  const metaProxy = smoketestScenarioMetaStateProxy();
  const processesProxy = orchestrationProcessesStateProxy();
  const loadQuestProxy = LoadQuestLayerResponderProxy();
  OverwriteWorkItemsLayerResponderProxy();

  queueProxy.setupEmpty();
  listenerProxy.setupEmpty();
  metaProxy.setupEmpty();
  processesProxy.setupEmpty();

  const mocked = EnqueueBundledSuiteLayerResponder as jest.MockedFunction<
    typeof EnqueueBundledSuiteLayerResponder
  >;
  mocked.mockResolvedValue(null);

  return {
    reset: (): void => {
      queueProxy.setupEmpty();
      listenerProxy.setupEmpty();
      metaProxy.setupEmpty();
    },
    setupReturnsRecord: ({
      record,
    }: {
      record: { questId: QuestId; guildSlug: UrlSlug };
    }): void => {
      mocked.mockResolvedValueOnce(record);
    },
    setupReturnsNull: (): void => {
      mocked.mockResolvedValueOnce(null);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        EnqueueBundledSuiteLayerResponder: typeof EnqueueBundledSuiteLayerResponder;
      }>({
        module: './enqueue-bundled-suite-layer-responder',
      });
      mocked.mockImplementation(realMod.EnqueueBundledSuiteLayerResponder);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
    getHydrateBrokerCallArgs: (): readonly unknown[][] => hydrateProxy.getCallArgs(),
    setupHydrateReturnsQuestId: ({ questId }: { questId: QuestId }): void => {
      hydrateProxy.setupReturnsQuestId({ questId });
    },
    setupLoadQuestReturns: ({ quest }: { quest: Quest }): void => {
      loadQuestProxy.setupReturnsQuest({ quest });
    },
  };
};
