/**
 * PURPOSE: Creates the `quest-modified` event handler used by smoketest-poll-quest-until-terminal-broker
 *
 * USAGE:
 * const handler = createPollHandlerLayerBroker({ questId, abortSignal, onTerminal, onError });
 * // Returns a handler that, when invoked with a quest-modified event payload, loads the quest
 * //   and invokes onTerminal/onError. Returns early if the abortSignal is aborted (the outer broker
 * //   aborts its signal after the first resolve/reject or after timeout to prevent double-settling).
 */

import type { ProcessId, Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { isSmoketestPollTerminalStatusGuard } from '../../../guards/is-smoketest-poll-terminal-status/is-smoketest-poll-terminal-status-guard';
import { loadQuestByIdLayerBroker } from './load-quest-by-id-layer-broker';

export const createPollHandlerLayerBroker =
  ({
    questId,
    abortSignal,
    onTerminal,
    onError,
  }: {
    questId: QuestId;
    abortSignal: AbortSignal;
    onTerminal: (quest: Quest) => void;
    onError: (error: Error) => void;
  }): ((event: { processId: ProcessId; payload: { questId?: unknown } }) => void) =>
  (event) => {
    if (abortSignal.aborted || event.payload.questId !== questId) {
      return;
    }
    loadQuestByIdLayerBroker({ questId })
      .then((quest) => {
        if (abortSignal.aborted) {
          return;
        }
        if (
          isSmoketestPollTerminalStatusGuard({
            status: quest.status,
            workItems: quest.workItems,
          })
        ) {
          onTerminal(quest);
        }
      })
      .catch((error: unknown) => {
        if (abortSignal.aborted) {
          return;
        }
        onError(
          error instanceof Error
            ? error
            : new Error('smoketestPollQuestUntilTerminalBroker: quest load failed'),
        );
      });
  };
