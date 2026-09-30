/**
 * PURPOSE: Defines the data held by `state` in orchestration-boot-flow
 *
 * USAGE:
 * orchestrationBootFlowStateContract.parse(value);
 * // Returns validated OrchestrationBootFlowState
 */
import { z } from '#gateway/npm/zod';

export const orchestrationBootFlowStateContract = z
  .object({ ran: z.boolean() })
  .brand<'OrchestrationBootFlowState'>();

export type OrchestrationBootFlowState = z.infer<typeof orchestrationBootFlowStateContract>;
