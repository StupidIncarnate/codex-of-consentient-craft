/**
 * PURPOSE: Creates the `quest-modified` event handler used by smoketestScenarioDriverBroker
 *
 * USAGE:
 * const handler = createDriverHandlerLayerBroker({ questId, abortSignal, dispense });
 * // Returns a handler that delegates to smoketestSweepPendingWorkItemsLayerBroker on each matching event.
 * // Returns early when the abortSignal is aborted.
 */

import type { ProcessId, QuestId, WorkItemRole } from '@dungeonmaster/shared/contracts';

import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { smoketestSweepPendingWorkItemsLayerBroker } from './smoketest-sweep-pending-work-items-layer-broker';

type Dispense = ({ role }: { role: WorkItemRole }) => SmoketestPromptName | null;

export const createDriverHandlerLayerBroker =
  ({
    questId,
    abortSignal,
    dispense,
  }: {
    questId: QuestId;
    abortSignal: AbortSignal;
    dispense: Dispense;
  }): ((event: { processId: ProcessId; payload: { questId?: unknown } }) => void) =>
  (event): void => {
    if (abortSignal.aborted || event.payload.questId !== questId) {
      return;
    }
    smoketestSweepPendingWorkItemsLayerBroker({ questId, abortSignal, dispense }).catch(
      (error: unknown) => {
        if (abortSignal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'unknown error';
        process.stderr.write(
          `[smoketestScenarioDriverBroker] stamp cycle failed for quest "${questId}": ${message}\n`,
        );
      },
    );
  };
