/**
 * PURPOSE: Defines the input schema for the MCP signal-back tool
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

// NOTE: MCP requires inputSchema to have type: "object" at root level.
// `complete` is the sole signal kind (session-terminal marker). questId + workItemId are required
// so the broker routes on explicit ids rather than inferring from process state. There is NO note
// field — the next-session handoff is the git commit message, not the ledger.
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
      .describe(
        'Why this role cannot proceed without the user. Names the wall and what the user must change (e.g. a denied command, a missing credential, an unreachable service)',
      )
      .optional(),
  })
  .strict();

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
