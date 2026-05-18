/**
 * PURPOSE: Adapter for StartOrchestrator.startMonitorWatcher that wraps the orchestrator package — kicks off the JSONL file-tail + orphan-reset for a newly-announced /dumpster-launch monitor session
 *
 * USAGE:
 * const handle = await orchestratorStartMonitorWatcherAdapter({
 *   parentSessionId: 'abc-123',
 *   projectDir: '/home/user/my-project',
 * });
 * // handle.stop() — tears down the tail and clears monitor-session state
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
