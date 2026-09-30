/**
 * PURPOSE: Responder that wires questMonitorWatcherStartBroker to orchestrationEventsState
 * — the broker can't import state/ directly, so this is the seam. Called from
 * StartOrchestrator.startMonitorWatcher by the server's quest-driven watcher reactor when
 * a new sessionId is observed on an in-progress workItem.
 *
 * USAGE:
 * const handle = await QuestMonitorWatcherStartResponder({ parentSessionId, projectDir, workerWorkItemId, workerQuestId });
 * // handle.stop() — tears down the tail
 */

import type { WorkItem, Quest } from '@dungeonmaster/shared/contracts';
import { questMonitorWatcherStartBroker } from '../../../brokers/quest/monitor-watcher-start/quest-monitor-watcher-start-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';

export const QuestMonitorWatcherStartResponder = async ({
  parentSessionId,
  projectDir,
  workerWorkItemId,
  workerQuestId,
}: {
  parentSessionId: string;
  projectDir: string;
  workerWorkItemId: WorkItem['id'];
  workerQuestId: Quest['id'];
}): Promise<{ stop: () => void }> =>
  questMonitorWatcherStartBroker({
    parentSessionId,
    projectDir,
    workerWorkItemId,
    workerQuestId,
    emit: ({ type, processId, payload }): void => {
      orchestrationEventsState.emit({ type, processId, payload });
    },
  });
