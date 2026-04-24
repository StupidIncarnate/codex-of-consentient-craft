/**
 * PURPOSE: Wires the smoketest post-terminal listener to real state + event-bus callbacks on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * SmoketestBootstrapListenerResponder();
 * // The listener is now subscribed to quest-modified; smoketest quests that hit terminal status get their assertions + teardown run and smoketestResults persisted.
 *
 * WHEN-TO-USE: Called once from StartOrchestrator module load (via SmoketestFlow.bootstrap).
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { smoketestPostTerminalListenerBroker } from '../../../brokers/smoketest/post-terminal-listener/smoketest-post-terminal-listener-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { DrainListenerLayerResponder } from './drain-listener-layer-responder';

type QuestModifiedHandler = Parameters<
  Parameters<typeof smoketestPostTerminalListenerBroker>[0]['subscribe']
>[0];

const state: { installed: { stop: () => void } | null } = {
  installed: null,
};

export const SmoketestBootstrapListenerResponder = (): AdapterResult => {
  const ok = adapterResultContract.parse({ success: true });
  if (state.installed !== null) {
    return ok;
  }
  state.installed = smoketestPostTerminalListenerBroker({
    subscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.on({ type: 'quest-modified', handler });
    },
    unsubscribe: (handler: QuestModifiedHandler): void => {
      orchestrationEventsState.off({ type: 'quest-modified', handler });
    },
    getListenerEntry: ({ questId }) => smoketestListenerState.get({ questId }),
    unregisterListener: ({ questId }): void => {
      // Delegates to a layer responder so the "drain + clear active flag when empty"
      // behavior is unit-testable in isolation. When the last smoketest quest drains
      // from the listener registry, the layer clears the active-run flag so a fresh
      // POST /api/tooling/smoketest/run can kick off a new suite.
      DrainListenerLayerResponder({ questId });
    },
    getScenarioMeta: ({ questId }) => smoketestScenarioMetaState.get({ questId }),
  });
  return ok;
};
