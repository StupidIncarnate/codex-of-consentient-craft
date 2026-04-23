/**
 * PURPOSE: Waits for a quest to reach a smoketest-terminal status (complete, blocked, or abandoned) or rejects on timeout
 *
 * USAGE:
 * const finalQuest = await smoketestPollQuestUntilTerminalBroker({
 *   questId,
 *   timeoutMs: TimeoutMsStub({ value: 300_000 }),
 *   subscribe: (handler) => orchestrationEventsState.on({ type: 'quest-modified', handler }),
 *   unsubscribe: (handler) => orchestrationEventsState.off({ type: 'quest-modified', handler }),
 * });
 * // Polls the quest file at a short interval and also subscribes via the supplied callbacks (forward-compat).
 * // Returns the loaded quest once its status is terminal.
 *
 * WHEN-TO-USE: The smoketest orchestration runner awaits each case's quest reaching a stable endpoint before
 * running assertions. Polling is the primary signal because `quest-modified` events flow through the file
 * outbox, not the in-memory `orchestrationEventsState` bus — subscribing to that bus alone will never see
 * the terminal status change the orchestration loop persists through questModifyBroker → questPersistBroker.
 *
 * WHY subscribe/unsubscribe are still accepted: keeps the caller wiring stable and lets the broker also react
 * to any future in-memory emission without requiring another signature change. The poll is what actually
 * settles the promise today.
 * WHEN-NOT-TO-USE: Outside smoketests. Production code should react to WS events or outbox tailers, not block.
 */

import type { ProcessId, Quest, QuestId, TimeoutMs } from '@dungeonmaster/shared/contracts';

import { isSmoketestPollTerminalStatusGuard } from '../../../guards/is-smoketest-poll-terminal-status/is-smoketest-poll-terminal-status-guard';
import { createPollHandlerLayerBroker } from './create-poll-handler-layer-broker';
import { loadQuestByIdLayerBroker } from './load-quest-by-id-layer-broker';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

// 250ms mirrors the scenario-driver's poll cadence. Short enough that a terminal-status write on the quest
// file is observed within a single orchestration-loop iteration in practice.
const DEFAULT_POLL_INTERVAL_MS = 250;

export const smoketestPollQuestUntilTerminalBroker = async ({
  questId,
  timeoutMs,
  subscribe,
  unsubscribe,
  pollIntervalMs,
}: {
  questId: QuestId;
  timeoutMs: TimeoutMs;
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  pollIntervalMs?: number;
}): Promise<Quest> =>
  new Promise<Quest>((resolve, reject) => {
    const abortController = new AbortController();
    const intervalMs = pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    let timer: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const handler = createPollHandlerLayerBroker({
      questId,
      abortSignal: abortController.signal,
      onTerminal: (quest) => {
        abortController.abort();
        if (timer !== null) {
          clearTimeout(timer);
        }
        if (pollInterval !== null) {
          clearInterval(pollInterval);
        }
        unsubscribe(handler);
        resolve(quest);
      },
      onError: (error) => {
        abortController.abort();
        if (timer !== null) {
          clearTimeout(timer);
        }
        if (pollInterval !== null) {
          clearInterval(pollInterval);
        }
        unsubscribe(handler);
        reject(error);
      },
    });

    timer = setTimeout(() => {
      if (abortController.signal.aborted) {
        return;
      }
      abortController.abort();
      if (pollInterval !== null) {
        clearInterval(pollInterval);
      }
      unsubscribe(handler);
      reject(
        new Error(
          `smoketestPollQuestUntilTerminalBroker: timed out after ${timeoutMs}ms waiting for terminal status on quest "${questId}"`,
        ),
      );
    }, timeoutMs);

    subscribe(handler);

    // Initial check + periodic poll. `quest-modified` is emitted through the file outbox (cross-process),
    // not the in-memory event bus, so subscribing alone will never catch the orchestration loop's terminal
    // status write inside this process. Polling guarantees termination is observed within intervalMs of the
    // questPersistBroker write. Each tick loads the quest file and resolves when the status is terminal.
    loadQuestByIdLayerBroker({ questId })
      .then((quest) => {
        if (abortController.signal.aborted) {
          return;
        }
        if (
          !isSmoketestPollTerminalStatusGuard({
            status: quest.status,
            workItems: quest.workItems,
          })
        ) {
          return;
        }
        abortController.abort();
        clearTimeout(timer);
        if (pollInterval !== null) {
          clearInterval(pollInterval);
        }
        unsubscribe(handler);
        resolve(quest);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }
        abortController.abort();
        clearTimeout(timer);
        if (pollInterval !== null) {
          clearInterval(pollInterval);
        }
        unsubscribe(handler);
        reject(
          error instanceof Error
            ? error
            : new Error('smoketestPollQuestUntilTerminalBroker: initial quest load failed'),
        );
      });

    pollInterval = setInterval(() => {
      if (abortController.signal.aborted) {
        return;
      }
      loadQuestByIdLayerBroker({ questId })
        .then((quest) => {
          if (abortController.signal.aborted) {
            return;
          }
          if (
            !isSmoketestPollTerminalStatusGuard({
              status: quest.status,
              workItems: quest.workItems,
            })
          ) {
            return;
          }
          abortController.abort();
          clearTimeout(timer);
          if (pollInterval !== null) {
            clearInterval(pollInterval);
          }
          unsubscribe(handler);
          resolve(quest);
        })
        .catch((error: unknown) => {
          if (abortController.signal.aborted) {
            return;
          }
          // Transient load errors during polling (e.g., concurrent quest file write) should NOT fail the
          // case — the next tick will retry. Log and continue.
          const message = error instanceof Error ? error.message : 'unknown error';
          process.stderr.write(
            `[smoketestPollQuestUntilTerminalBroker] poll load failed for quest "${questId}": ${message}\n`,
          );
        });
    }, intervalMs);
  });
