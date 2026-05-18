/**
 * PURPOSE: Defines the input schema for the MCP signal-back tool
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', summary: '...', questId, workItemId });
 * // Returns validated signal-back input (complete, failed, or failed-replan) tagged with quest + work item ids
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

// NOTE: MCP requires inputSchema to have type: "object" at root level.
// Agents signal complete or failed. The orchestrator owns failure routing
// (which role to spawn next) via a static role map — agents don't choose.
// questId + workItemId are required so the broker routes on explicit ids
// rather than inferring from process state.
export const signalBackInputContract = z
  .object({
    questId: questIdContract.describe('The quest the signalling agent is working on'),
    workItemId: questWorkItemIdContract.describe(
      'The work item the signalling agent was dispatched against',
    ),
    signal: z
      .enum(['complete', 'failed', 'failed-replan'])
      .describe(
        'Signal type: complete when work succeeded, failed when it did not, failed-replan when work needs PathSeeker to add new steps before retry',
      ),
    summary: z
      .string()
      .min(1)
      .brand<'SignalSummary'>()
      .describe('Summary of what was done or what went wrong — passed to the next agent on failure')
      .optional(),
  })
  .strict();

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
