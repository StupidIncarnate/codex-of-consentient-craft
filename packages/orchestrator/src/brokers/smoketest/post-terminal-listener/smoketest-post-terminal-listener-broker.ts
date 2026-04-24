/**
 * PURPOSE: Installs a global quest-modified handler that runs assertions + teardown + writes smoketestResults on any smoketest quest the moment it reaches a terminal status
 *
 * USAGE:
 * const handle = smoketestPostTerminalListenerBroker({
 *   subscribe: (handler) => orchestrationEventsState.on({ type: 'quest-modified', handler }),
 *   unsubscribe: (handler) => orchestrationEventsState.off({ type: 'quest-modified', handler }),
 *   getListenerEntry: ({ questId }) => smoketestListenerState.get({ questId }),
 *   unregisterListener: ({ questId }) => smoketestListenerState.unregister({ questId }),
 *   getScenarioMeta: ({ questId }) => smoketestScenarioMetaState.get({ questId }),
 * });
 * handle.stop();
 *
 * WHEN-TO-USE: Wired once from the smoketest flow at module load so any smoketest quest that terminates
 * gets its post-terminal checks and result persistence.
 * WHEN-NOT-TO-USE: Outside the smoketest flow.
 *
 * WHY subscribe/unsubscribe/getListenerEntry/unregisterListener/getScenarioMeta are injected:
 * brokers/ cannot import state/. The caller (a flow or responder at module load) wires the real event
 * bus and the state callbacks.
 */

import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import type { SmoketestListenerEntry } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import type { SmoketestScenarioMeta } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { createTerminalHandlerLayerBroker } from './create-terminal-handler-layer-broker';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const smoketestPostTerminalListenerBroker = ({
  subscribe,
  unsubscribe,
  getListenerEntry,
  unregisterListener,
  getScenarioMeta,
}: {
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  getListenerEntry: ({ questId }: { questId: QuestId }) => SmoketestListenerEntry | undefined;
  unregisterListener: ({ questId }: { questId: QuestId }) => void;
  getScenarioMeta: ({ questId }: { questId: QuestId }) => SmoketestScenarioMeta | undefined;
}): { stop: () => void } => {
  const handler = createTerminalHandlerLayerBroker({
    getListenerEntry,
    unregisterListener,
    getScenarioMeta,
  });

  subscribe(handler);

  return {
    stop: (): void => {
      unsubscribe(handler);
    },
  };
};
