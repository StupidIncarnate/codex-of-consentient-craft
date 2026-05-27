/**
 * PURPOSE: Responder that wires questMonitorWatcherStartBroker to monitorSessionState and orchestrationEventsState — the broker can't import state/ directly, so this is the seam. Called from StartOrchestrator.startMonitorWatcher when the HTTP server reactor observes a new active-monitor-session.json
 *
 * USAGE:
 * const handle = await QuestMonitorWatcherStartResponder({ parentSessionId, projectDir });
 * // handle.stop() — tears down the tail and clears monitorSessionState
 */

import { questMonitorWatcherStartBroker } from '../../../brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker';
import { monitorSessionState } from '../../../state/monitor-session/monitor-session-state';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

export const QuestMonitorWatcherStartResponder = async ({
  parentSessionId,
  projectDir,
}: {
  parentSessionId: string;
  projectDir: string;
}): Promise<{ stop: () => void }> =>
  questMonitorWatcherStartBroker({
    parentSessionId,
    projectDir,
    monitorSession: monitorSessionState,
    emit: ({ type, processId, payload }): void => {
      orchestrationEventsState.emit({ type, processId, payload });
    },
  });
