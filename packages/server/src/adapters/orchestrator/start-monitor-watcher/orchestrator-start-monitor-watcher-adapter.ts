/**
 * PURPOSE: Adapter for StartOrchestrator.startMonitorWatcher that wraps the orchestrator package — kicks off the JSONL file-tail + orphan-reset for a parent Claude Code session whose id is stamped on an in-progress workItem.
 *
 * USAGE:
 * const handle = await orchestratorStartMonitorWatcherAdapter({
 *   parentSessionId: 'abc-123',
 *   projectDir: '/home/user/my-project',
 *   workerWorkItemId: 'work-item-uuid', // optional — set for top-level node-dispatch workers
 * });
 * // handle.stop() — tears down the tail
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStartMonitorWatcherAdapter = async ({
  parentSessionId,
  projectDir,
  ...workerParams
}: {
  parentSessionId: string;
  projectDir: string;
  // Present when the tailed session is a top-level node-dispatch worker (its work item has
  // a sessionId but no agentId). Forwarded so the worker's main-session output routes to
  // its execution row instead of being dropped as /dumpster-launch dispatcher chatter.
  workerWorkItemId?: string;
}): Promise<{ stop: () => void }> =>
  StartOrchestrator.startMonitorWatcher({ parentSessionId, projectDir, ...workerParams });
