/**
 * PURPOSE: Builds the setInterval tick callback used by smoketestScenarioDriverBroker — each tick runs a sweep and self-destructs the driver when the quest has disappeared
 *
 * USAGE:
 * const tick = createDriverPollTickLayerBroker({ questId, abortSignal, dispense, stopNow, onQuestGone });
 * setInterval(tick, 250);
 * // Each tick calls smoketestSweepPendingWorkItemsLayerBroker. If the sweep rejects with a
 * // "quest not found in any guild" error, stopNow() runs (clearInterval + abort + unsubscribe)
 * // and onQuestGone is fired so the caller can release per-quest state.
 */

import type { QuestId, WorkItemRole } from '@dungeonmaster/shared/contracts';

import { GuildNotFoundError } from '../../../errors/guild-not-found/guild-not-found-error';
import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import type { SmoketestPromptName } from '../../../statics/smoketest-prompts/smoketest-prompts-statics';
import { smoketestSweepPendingWorkItemsLayerBroker } from './smoketest-sweep-pending-work-items-layer-broker';

type Dispense = ({ role }: { role: WorkItemRole }) => SmoketestPromptName | null;

export const createDriverPollTickLayerBroker =
  ({
    questId,
    abortSignal,
    dispense,
    stopNow,
    onQuestGone,
  }: {
    questId: QuestId;
    abortSignal: AbortSignal;
    dispense: Dispense;
    stopNow: () => void;
    onQuestGone?: (params: { questId: QuestId }) => void;
  }): (() => void) =>
  (): void => {
    if (abortSignal.aborted) {
      return;
    }
    smoketestSweepPendingWorkItemsLayerBroker({
      questId,
      abortSignal,
      dispense,
    }).catch((error: unknown) => {
      if (abortSignal.aborted) {
        return;
      }
      if (error instanceof QuestNotFoundError || error instanceof GuildNotFoundError) {
        stopNow();
        if (onQuestGone !== undefined) {
          onQuestGone({ questId });
        }
        return;
      }
      const message = error instanceof Error ? error.message : 'unknown error';
      process.stderr.write(
        `[smoketestScenarioDriverBroker] poll sweep failed for quest "${questId}": ${message}\n`,
      );
    });
  };
