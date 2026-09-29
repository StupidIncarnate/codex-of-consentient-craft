/**
 * PURPOSE: Wires the smoketest post-terminal listener to real state + the quest-outbox watcher on orchestrator startup. Idempotent — subsequent calls are no-ops.
 *
 * USAGE:
 * SmoketestBootstrapListenerResponder();
 * // The listener is now subscribed to the quest-outbox file (which questPersistBroker writes
 * // to on every quest mutation). When a smoketest quest hits a terminal status, its
 * // assertions + teardown run and smoketestResults persist; when the last smoketest quest
 * // drains from the listener registry, the active-run flag clears so a fresh
 * // POST /api/tooling/smoketest/run can kick off another suite.
 *
 * WHEN-TO-USE: Called once from `StartOrchestrator.bootstrap()` (via SmoketestFlow.bootstrap).
 * WHEN-NOT-TO-USE: Not for request-scoped invocation.
 *
 * WHY the outbox watcher (not orchestrationEventsState): `quest-modified` events flow through
 * the file outbox (cross-process), not the in-memory event bus. The smoketest listener MUST tail
 * the outbox to see natural terminal transitions the orchestration loop persists in-process.
 */

import { stderr } from '#gateway/node/process';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { questOutboxWatchBroker } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker';
import { smoketestPostTerminalListenerBroker } from '../../../brokers/smoketest/post-terminal-listener/smoketest-post-terminal-listener-broker';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { DrainListenerLayerResponder } from './drain-listener-layer-responder';

const state: { installed: { stop: () => void } | null; installing: boolean } = {
  installed: null,
  installing: false,
};

export const SmoketestBootstrapListenerResponder = (): void => {
  if (state.installed !== null || state.installing) {
    return;
  }
  state.installing = true;
  smoketestPostTerminalListenerBroker({
    install: async (
      onQuestChanged: (args: { questId: QuestId }) => void,
    ): Promise<{ stop: () => void }> =>
      questOutboxWatchBroker({
        onQuestChanged,
        onError: ({ error }: { error: unknown }): void => {
          stderr.write(
            `[SmoketestBootstrapListenerResponder] outbox watch error: ${String(error)}\n`,
          );
        },
      }),
    getListenerEntry: ({ questId }) => smoketestListenerState.get({ questId }),
    unregisterListener: ({ questId }): void => {
      // Delegates to a layer responder so the "drain + clear active flag when empty"
      // behavior is unit-testable in isolation. When the last smoketest quest drains
      // from the listener registry, the layer clears the active-run flag so a fresh
      // POST /api/tooling/smoketest/run can kick off a new suite.
      DrainListenerLayerResponder({ questId });
    },
    getScenarioMeta: ({ questId }) => smoketestScenarioMetaState.get({ questId }),
  })
    .then((handle: { stop: () => void }): void => {
      state.installed = handle;
      state.installing = false;
    })
    .catch((error: unknown): void => {
      state.installing = false;
      stderr.write(`[SmoketestBootstrapListenerResponder] install failed: ${String(error)}\n`);
    });
};
