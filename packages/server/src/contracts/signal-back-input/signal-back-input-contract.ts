/**
 * PURPOSE: Defines the input schema for the env-gated HTTP signal-back endpoint — mirrors the
 * MCP signal-back tool's input so the same relay outcome (done/partial) can be applied over HTTP.
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', questId, workItemId, operationItemId, operationStatus: 'done' });
 * // Returns validated signal-back input — the session-terminal marker plus the operation outcome
 */
import { z } from 'zod';

import {
  operationItemIdContract,
  questIdContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';

// `complete` is the sole signal kind (session-terminal marker); the outcome rides on the call as
// operationStatus and the handler applies it server-side (authoritative): 'done' marks the linked
// operation item complete and advances; 'partial' marks it complete AND appends a "pt N"
// continuation item a fresh session continues. questId + workItemId are required so the handler
// routes on explicit ids rather than inferring from process state.
export const signalBackInputContract = z
  .object({
    questId: questIdContract.describe('The quest the signalling agent is working on'),
    workItemId: questWorkItemIdContract.describe(
      'The work item the signalling agent was dispatched against',
    ),
    signal: z
      .literal('complete')
      .describe('Session-terminal marker — the only signal kind. The outcome is operationStatus'),
    operationItemId: operationItemIdContract
      .describe('The operation item this session worked (from the operations ledger)')
      .optional(),
    operationStatus: z
      .enum(['done', 'partial'])
      .describe(
        "Outcome of the operation item: 'done' = scope complete (advance); 'partial' = more remains (the orchestrator marks this item complete and appends a pt N continuation)",
      )
      .optional(),
  })
  .strict();

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
