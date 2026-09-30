/**
 * PURPOSE: Defines the data held by `state` in execution-queue-bootstrap-responder
 *
 * USAGE:
 * executionQueueBootstrapResponderStateContract.parse(value);
 * // Returns validated ExecutionQueueBootstrapResponderState
 */
import { z } from '#gateway/npm/zod';

export const executionQueueBootstrapResponderStateContract = z
  .object({ installed: z.boolean() })
  .brand<'ExecutionQueueBootstrapResponderState'>();

export type ExecutionQueueBootstrapResponderState = z.infer<
  typeof executionQueueBootstrapResponderStateContract
>;
