/**
 * PURPOSE: Boots the quest-driven JSONL watcher reactor at HTTP server startup. The
 * reactor tails one JSONL per distinct sessionId stamped onto an in-progress workItem
 * across all active quests, reconciling its watcher set on every quest-modified outbox
 * event. No HTTP routes — this is a side-effect-only flow.
 *
 * USAGE:
 * QuestDrivenWatchersFlow.bootstrap();
 * // Side effect: starts QuestDrivenWatchersBootstrapResponder for the server's lifetime
 */

import { QuestDrivenWatchersBootstrapResponder } from '../../responders/quest-driven-watchers/bootstrap/quest-driven-watchers-bootstrap-responder';

const state: { handle: { stop: () => void } | null } = { handle: null };

export const QuestDrivenWatchersFlow = {
  bootstrap: (): void => {
    if (state.handle !== null) return;
    QuestDrivenWatchersBootstrapResponder()
      .then((handle): void => {
        state.handle = handle;
      })
      .catch((error: unknown): void => {
        process.stderr.write(`[QuestDrivenWatchersFlow.bootstrap] failed: ${String(error)}\n`);
      });
  },
  shutdown: (): void => {
    if (state.handle === null) return;
    state.handle.stop();
    state.handle = null;
  },
};
