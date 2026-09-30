/**
 * PURPOSE: Creates the quest-changed event handler used by smoketestPostTerminalListenerBroker
 *
 * USAGE:
 * const handler = createTerminalHandlerLayerBroker({ getListenerEntry, unregisterListener, getScenarioMeta });
 * handler({ questId });
 * // On every matching event delegates to processTerminalEventLayerBroker.
 */

import { stderr } from '#gateway/node/process';
import type { Quest } from '@dungeonmaster/shared/contracts';

import type { SmoketestListenerEntry } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry-contract';
import type { SmoketestScenarioMeta } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta-contract';
import { processTerminalEventLayerBroker } from './process-terminal-event-layer-broker';

export const createTerminalHandlerLayerBroker =
  ({
    getListenerEntry,
    unregisterListener,
    getScenarioMeta,
  }: {
    getListenerEntry: ({ questId }: { questId: Quest['id'] }) => SmoketestListenerEntry | undefined;
    unregisterListener: ({ questId }: { questId: Quest['id'] }) => void;
    getScenarioMeta: ({ questId }: { questId: Quest['id'] }) => SmoketestScenarioMeta | undefined;
  }): (({ questId }: { questId: Quest['id'] }) => void) =>
  ({ questId }): void => {
    const entry = getListenerEntry({ questId });
    if (entry === undefined) return;
    const scenarioMeta = getScenarioMeta({ questId });
    if (scenarioMeta === undefined) return;

    processTerminalEventLayerBroker({
      questId,
      entry,
      scenarioMeta,
      unregisterListener,
    }).catch((error: unknown) => {
      stderr.write(
        `[smoketestPostTerminalListenerBroker] handler failed for quest ${questId}: ${String(error)}\n`,
      );
      // Defensive unregister: if the assertion/persist path threw for any reason
      // (not the quest-not-found case, which the inner broker already handles), we
      // still need to drain the listener so the bootstrap responder's unregister
      // callback can clear the active-run flag. Otherwise one unhandled rejection
      // leaves the suite stuck and every subsequent POST /smoketest/run returns 409.
      if (entry.stopDriver !== undefined) {
        entry.stopDriver();
      }
      unregisterListener({ questId });
    });
  };
