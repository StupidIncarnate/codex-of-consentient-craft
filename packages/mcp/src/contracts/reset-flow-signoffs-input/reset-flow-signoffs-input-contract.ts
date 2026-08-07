/**
 * PURPOSE: Validates input for the reset-flow-signoffs MCP tool
 *
 * USAGE:
 * resetFlowSignoffsInputContract.parse({questId: 'add-auth', workItemId: 'f47ac10b-…', flowId: 'login-flow', reason: 'fixed the redirect guard'});
 * // Returns: ResetFlowSignoffsInput for clearing Siegemaster's sign-offs across one flow
 *
 * `workItemId` is required because there is NO ambient caller identity over MCP stdio — one MCP
 * child serves the parent session and every sub-agent it dispatched, so the call must say which
 * work item it is. It is what the orchestrator resolves the operation item (and therefore the flow
 * scope) from, exactly as `signal-back` and `run-ward` do.
 */

import { z } from 'zod';

export const resetFlowSignoffsInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest the flow belongs to')
      .brand<'QuestId'>(),
    workItemId: z
      .string()
      .min(1)
      .describe(
        'The work item you were dispatched against. Its linked operation item is what declares which flows you may reset',
      )
      .brand<'QuestWorkItemId'>(),
    flowId: z
      .string()
      .min(1)
      .describe('The flow whose siegemasterSignoff values are cleared. Must be in your scope')
      .brand<'FlowId'>(),
    reason: z
      .string()
      .min(1)
      .describe(
        'Why the walk is being reset — what changed underneath the sign-offs. Recorded verbatim as the walk-reset note detail',
      )
      .brand<'ResetReason'>(),
  })
  .strict()
  .brand<'ResetFlowSignoffsInput'>();

export type ResetFlowSignoffsInput = z.infer<typeof resetFlowSignoffsInputContract>;
