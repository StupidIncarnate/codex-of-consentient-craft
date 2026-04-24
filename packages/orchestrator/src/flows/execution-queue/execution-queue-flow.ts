/**
 * PURPOSE: Orchestration flow exposing the cross-guild quest execution queue — bootstrap wiring, web-presence toggle, and snapshot reads
 *
 * USAGE:
 * ExecutionQueueFlow.bootstrap();
 * ExecutionQueueFlow.bootstrapSyncListener();
 * ExecutionQueueFlow.setWebPresence({ isPresent: true });
 * const entries = ExecutionQueueFlow.getAll();
 * // Returns readonly QuestQueueEntry[] representing the current queue state.
 */

import type { AdapterResult, QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { ExecutionQueueBootstrapResponder } from '../../responders/execution-queue/bootstrap/execution-queue-bootstrap-responder';
import { ExecutionQueueGetAllResponder } from '../../responders/execution-queue/get-all/execution-queue-get-all-responder';
import { ExecutionQueueSetWebPresenceResponder } from '../../responders/execution-queue/set-web-presence/execution-queue-set-web-presence-responder';
import { ExecutionQueueSyncListenerBootstrapResponder } from '../../responders/execution-queue/sync-listener-bootstrap/execution-queue-sync-listener-bootstrap-responder';

export const ExecutionQueueFlow = {
  bootstrap: (): AdapterResult => ExecutionQueueBootstrapResponder(),

  bootstrapSyncListener: (): AdapterResult => ExecutionQueueSyncListenerBootstrapResponder(),

  getAll: (): readonly QuestQueueEntry[] => ExecutionQueueGetAllResponder(),

  setWebPresence: ({ isPresent }: { isPresent: boolean }): AdapterResult =>
    ExecutionQueueSetWebPresenceResponder({ isPresent }),
};
