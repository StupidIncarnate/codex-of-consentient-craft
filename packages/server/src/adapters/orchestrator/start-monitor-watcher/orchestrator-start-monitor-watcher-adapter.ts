/**
 * PURPOSE: Adapter for StartOrchestrator.startMonitorWatcher that wraps the orchestrator package — kicks off the JSONL file-tail + orphan-reset for a parent Claude Code session whose id is stamped on an in-progress workItem.
 *
 * USAGE:
 * const handle = await orchestratorStartMonitorWatcherAdapter({
 *   parentSessionId: 'abc-123',
 *   projectDir: '/home/user/my-project',
 * });
 * // handle.stop() — tears down the tail
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorStartMonitorWatcherAdapter = async ({
  parentSessionId,
  projectDir,
}: {
  parentSessionId: string;
  projectDir: string;
}): Promise<{ stop: () => void }> =>
  StartOrchestrator.startMonitorWatcher({ parentSessionId, projectDir });
