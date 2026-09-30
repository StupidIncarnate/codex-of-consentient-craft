/**
 * PURPOSE: Defines the input schema for the env-gated HTTP signal-back endpoint — mirrors the
 * MCP signal-back tool's input.
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', questId, workItemId, operationItemId });
 * // Returns validated signal-back input — the session-terminal marker
 */
import { z } from '#gateway/npm/zod';

import {
  questContract,
  workItemContract,
  operationItemContract,
} from '@dungeonmaster/shared/contracts';

// `complete` is the sole signal kind (session-terminal marker). questId + workItemId are required
// so the handler routes on explicit ids rather than inferring from process state.
export const signalBackInputContract = z
  .object({
    questId: questContract.shape.id.describe('The quest the signalling agent is working on'),
    workItemId: workItemContract.shape.id.describe(
      'The work item the signalling agent was dispatched against',
    ),
    signal: z.literal('complete').describe('Session-terminal marker — the only signal kind'),
    operationItemId: operationItemContract.shape.id
      .describe('The operation item this session worked (from the operations ledger)')
      .optional(),
    blockedReason: z
      .string()
      .min(1)
      .brand<'SignalBackInputBlockedReason'>()
      .describe('Why this role cannot proceed without the user')
      .optional(),
  })
  .strict()
  .brand<'SignalBackInput'>();

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
