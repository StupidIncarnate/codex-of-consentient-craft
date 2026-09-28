/**
 * PURPOSE: Adapter for StartOrchestrator.startMonitorWatcher that wraps the orchestrator package — kicks off the JSONL file-tail + orphan-reset for a Node-dispatch worker's own session whose id is stamped on an in-progress workItem.
 *
 * USAGE:
 * const handle = await orchestratorStartMonitorWatcherAdapter({
 *   parentSessionId: 'abc-123',
 *   projectDir: '/home/user/my-project',
 *   workerWorkItemId: 'work-item-uuid',
 *   workerQuestId: 'quest-uuid',
 * });
 * // handle.stop() — tears down the tail
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStartMonitorWatcherAdapter = async ({
  parentSessionId,
  projectDir,
  workerWorkItemId,
  workerQuestId,
}: {
  parentSessionId: string;
  projectDir: string;
  // The work item whose agent writes this session's MAIN JSONL. Forwarded so the worker's
  // main-session output routes to its own execution row.
  workerWorkItemId: string;
  // The quest owning that work item. Forwarded so the tail's own terminal event carries a
  // questId the server's per-quest subscription filter can route on.
  workerQuestId: string;
}): Promise<{ stop: () => void }> =>
  StartOrchestrator.startMonitorWatcher({
    parentSessionId,
    projectDir,
    workerWorkItemId,
    workerQuestId,
  });
