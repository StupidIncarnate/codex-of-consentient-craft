/**
 * PURPOSE: Proxy for EnqueueOrchestrationScenarioLayerResponder — registerModuleMock so
 * sibling tests (smoketest-run-responder) can stub the orchestration-scenario path.
 */

import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { questHydrateBrokerProxy } from '../../../brokers/quest/hydrate/quest-hydrate-broker.proxy';
import { smoketestScenarioDriverBrokerProxy } from '../../../brokers/smoketest/scenario-driver/smoketest-scenario-driver-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';
import { smoketestScenarioStateProxy } from '../../../state/smoketest-scenario/smoketest-scenario-state.proxy';
import { EnqueueOrchestrationScenarioLayerResponder } from './enqueue-orchestration-scenario-layer-responder';
import { LoadQuestLayerResponderProxy } from './load-quest-layer-responder.proxy';

registerModuleMock({ module: './enqueue-orchestration-scenario-layer-responder' });

export const EnqueueOrchestrationScenarioLayerResponderProxy = (): {
  reset: () => void;
  setupReturnsRecord: (params: { record: { questId: QuestId; guildSlug: UrlSlug } }) => void;
  setupRejectsOnce: (params: { error: Error }) => void;
  setupPassthrough: () => void;
  getCallArgs: () => readonly unknown[][];
} => {
  questHydrateBrokerProxy();
  smoketestScenarioDriverBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const queueProxy = questExecutionQueueStateProxy();
  const listenerProxy = smoketestListenerStateProxy();
  const metaProxy = smoketestScenarioMetaStateProxy();
  smoketestScenarioStateProxy();
  LoadQuestLayerResponderProxy();

  eventsProxy.setupEmpty();
  queueProxy.setupEmpty();
  listenerProxy.setupEmpty();
  metaProxy.setupEmpty();

  const mocked = EnqueueOrchestrationScenarioLayerResponder as jest.MockedFunction<
    typeof EnqueueOrchestrationScenarioLayerResponder
  >;

  return {
    reset: (): void => {
      eventsProxy.setupEmpty();
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
    setupRejectsOnce: ({ error }: { error: Error }): void => {
      mocked.mockRejectedValueOnce(error);
    },
    setupPassthrough: (): void => {
      const realMod = requireActual<{
        EnqueueOrchestrationScenarioLayerResponder: typeof EnqueueOrchestrationScenarioLayerResponder;
      }>({
        module: './enqueue-orchestration-scenario-layer-responder',
      });
      mocked.mockImplementation(realMod.EnqueueOrchestrationScenarioLayerResponder);
    },
    getCallArgs: (): readonly unknown[][] => mocked.mock.calls,
  };
};
