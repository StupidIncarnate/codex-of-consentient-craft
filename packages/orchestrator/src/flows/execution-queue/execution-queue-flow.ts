/**
 * PURPOSE: Orchestration flow exposing the cross-guild quest execution queue — bootstrap wiring and snapshot reads
 *
 * USAGE:
 * ExecutionQueueFlow.bootstrap();
 * const entries = ExecutionQueueFlow.getAll();
 * // Returns readonly QuestQueueEntry[] representing the current queue state.
 */

import type { AdapterResult, QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { ExecutionQueueBootstrapResponder } from '../../responders/execution-queue/bootstrap/execution-queue-bootstrap-responder';
import { ExecutionQueueGetAllResponder } from '../../responders/execution-queue/get-all/execution-queue-get-all-responder';

export const ExecutionQueueFlow = {
  bootstrap: (): AdapterResult => ExecutionQueueBootstrapResponder(),

  getAll: (): readonly QuestQueueEntry[] => ExecutionQueueGetAllResponder(),
};
