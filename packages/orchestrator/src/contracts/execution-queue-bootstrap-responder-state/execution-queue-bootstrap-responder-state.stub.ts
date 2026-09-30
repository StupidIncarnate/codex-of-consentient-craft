/**
 * PURPOSE: Builds a valid ExecutionQueueBootstrapResponderState for tests
 *
 * USAGE:
 * ExecutionQueueBootstrapResponderStateStub();
 * // Returns a valid ExecutionQueueBootstrapResponderState
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { executionQueueBootstrapResponderStateContract } from './execution-queue-bootstrap-responder-state-contract';
import type { ExecutionQueueBootstrapResponderState } from './execution-queue-bootstrap-responder-state-contract';

export const ExecutionQueueBootstrapResponderStateStub = ({
  ...props
}: StubArgument<ExecutionQueueBootstrapResponderState> = {}): ExecutionQueueBootstrapResponderState =>
  executionQueueBootstrapResponderStateContract.parse({ installed: false, ...props });
