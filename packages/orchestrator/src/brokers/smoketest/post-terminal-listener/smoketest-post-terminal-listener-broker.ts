/**
 * PURPOSE: Installs a global quest-changed handler that runs assertions + teardown + writes smoketestResults on any smoketest quest the moment it reaches a terminal status
 *
 * USAGE:
 * const handle = await smoketestPostTerminalListenerBroker({
 *   install: async (onQuestChanged) =>
 *     questOutboxWatchBroker({ onQuestChanged, onError: (...) => ... }),
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
 * WHY install/getListenerEntry/unregisterListener/getScenarioMeta are injected:
 * brokers/ cannot import state/. The caller (a bootstrap responder) wires the real event
 * source (the outbox watcher) and the state-backed callbacks.
 *
 * WHY the outbox watcher is the event source: `quest-modified` is emitted through the
 * file outbox (via questPersistBroker), not on the in-memory `orchestrationEventsState`
 * bus — subscribing to the in-memory bus would never see the terminal-status writes the
 * orchestration loop persists. The outbox watcher fires `onQuestChanged({questId})` on
 * every quest-persist line, which is what this listener needs to spot natural terminal
 * transitions and clear the smoketest active-run flag.
 */

import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { SmoketestListenerEntry } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import type { SmoketestScenarioMeta } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { createTerminalHandlerLayerBroker } from './create-terminal-handler-layer-broker';

type QuestChangedHandler = (args: { questId: QuestId }) => void;

export const smoketestPostTerminalListenerBroker = async ({
  install,
  getListenerEntry,
  unregisterListener,
  getScenarioMeta,
}: {
  install: (onQuestChanged: QuestChangedHandler) => Promise<{ stop: () => void }>;
  getListenerEntry: ({ questId }: { questId: QuestId }) => SmoketestListenerEntry | undefined;
  unregisterListener: ({ questId }: { questId: QuestId }) => void;
  getScenarioMeta: ({ questId }: { questId: QuestId }) => SmoketestScenarioMeta | undefined;
}): Promise<{ stop: () => void }> => {
  const handler = createTerminalHandlerLayerBroker({
    getListenerEntry,
    unregisterListener,
    getScenarioMeta,
  });

  const { stop } = await install(handler);

  return {
    stop: (): void => {
      stop();
    },
  };
};
