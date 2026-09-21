/**
 * PURPOSE: Defines the input schema for the env-gated HTTP signal-back endpoint — mirrors the
 * MCP signal-back tool's input.
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', questId, workItemId, operationItemId });
 * // Returns validated signal-back input — the session-terminal marker
 */
import { z } from 'zod';

import {
  blockedReasonContract,
  operationItemIdContract,
  questIdContract,
  questWorkItemIdContract,
} from '@dungeonmaster/shared/contracts';

// `complete` is the sole signal kind (session-terminal marker). questId + workItemId are required
// so the handler routes on explicit ids rather than inferring from process state.
export const signalBackInputContract = z
  .object({
    questId: questIdContract.describe('The quest the signalling agent is working on'),
    workItemId: questWorkItemIdContract.describe(
      'The work item the signalling agent was dispatched against',
    ),
    signal: z.literal('complete').describe('Session-terminal marker — the only signal kind'),
    operationItemId: operationItemIdContract
      .describe('The operation item this session worked (from the operations ledger)')
      .optional(),
    blockedReason: blockedReasonContract
      .describe('Why this role cannot proceed without the user')
      .optional(),
  })
  .strict();

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
