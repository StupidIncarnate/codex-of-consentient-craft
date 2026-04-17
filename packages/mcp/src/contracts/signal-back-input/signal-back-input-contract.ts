/**
 * PURPOSE: Defines the input schema for the MCP signal-back tool
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', summary: '...' });
 * // Returns validated signal-back input (complete or failed)
 */
import { z } from 'zod';

// NOTE: MCP requires inputSchema to have type: "object" at root level.
// Agents signal complete or failed. The orchestrator owns failure routing
// (which role to spawn next) via a static role map — agents don't choose.
export const signalBackInputContract = z
  .object({
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
