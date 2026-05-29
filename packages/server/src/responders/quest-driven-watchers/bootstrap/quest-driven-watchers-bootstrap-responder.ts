/**
 * PURPOSE: Bootstraps a server-lifetime reactor that maintains one JSONL watcher per
 * distinct parent sessionId referenced by an in-progress workItem across all active quests.
 * Source of truth is the on-disk quest files. The reactor reconciles its watcher set on
 * startup, on every quest-modified outbox event, AND on a periodic fallback timer (the
 * timer catches direct file writes that bypass the outbox — primarily e2e test setup via
 * `writeQuestFile` and any future tooling that mutates quest.json without going through
 * questPersistBroker). Replaces the deleted active-monitor-session.json file-watching.
 *
 * USAGE:
 * const handle = await QuestDrivenWatchersBootstrapResponder();
 * // handle.stop() — tears down every active watcher and the outbox subscription
 *
 * WHEN-TO-USE: Once from start-server.ts, before HTTP listening begins.
 * WHEN-NOT-TO-USE: Anywhere needing a single-session watcher — this owns the global set.
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import type { SessionId } from '@dungeonmaster/shared/contracts';

import { orchestratorOutboxWatchAdapter } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';
import { ReconcileWatchersLayerResponder } from './reconcile-watchers-layer-responder';

const FALLBACK_RECONCILE_INTERVAL_MS = 3000;

export const QuestDrivenWatchersBootstrapResponder = async (): Promise<{
  stop: () => void;
}> => {
  const watchers = new Map<SessionId, { stop: () => void }>();
  const projectDir = String(processCwdAdapter());
  // Mutable container so the outbox callback and the interval timer below can append to
  // the same chain without declaring a nested function that captures a `let` binding.
  const chain: { promise: Promise<unknown> } = { promise: Promise.resolve() };

  const outboxResult = await orchestratorOutboxWatchAdapter({
    onQuestChanged: (): void => {
      chain.promise = chain.promise
        .then(
          async (): Promise<unknown> => ReconcileWatchersLayerResponder({ watchers, projectDir }),
        )
        .catch((error: unknown): void => {
          processDevLogAdapter({
            message: `quest-driven-watchers: reconcile failed: ${String(error)}`,
          });
        });
    },
    onError: ({ error }: { error: unknown }): void => {
      processDevLogAdapter({
        message: `quest-driven-watchers: outbox error: ${String(error)}`,
      });
    },
  });

  // Initial reconcile catches sessionIds present from before the server booted.
  chain.promise = chain.promise
    .then(async (): Promise<unknown> => ReconcileWatchersLayerResponder({ watchers, projectDir }))
    .catch((error: unknown): void => {
      processDevLogAdapter({
        message: `quest-driven-watchers: initial reconcile failed: ${String(error)}`,
      });
    });

  // Periodic fallback reconcile. The outbox event is the primary trigger and fires within
  // milliseconds of a quest mutation — this poll exists only to catch direct quest.json
  // writes that don't route through questPersistBroker (e2e harnesses, ad-hoc fs.writeFile).
  // Production never relies on this path.
  const intervalHandle = setInterval((): void => {
    chain.promise = chain.promise
      .then(async (): Promise<unknown> => ReconcileWatchersLayerResponder({ watchers, projectDir }))
      .catch((error: unknown): void => {
        processDevLogAdapter({
          message: `quest-driven-watchers: poll reconcile failed: ${String(error)}`,
        });
      });
  }, FALLBACK_RECONCILE_INTERVAL_MS);
  // Avoid keeping the process alive solely for this timer in test runtimes.
  intervalHandle.unref();

  return {
    stop: (): void => {
      clearInterval(intervalHandle);
      outboxResult.stop();
      for (const handle of watchers.values()) {
        handle.stop();
      }
      watchers.clear();
    },
  };
};
