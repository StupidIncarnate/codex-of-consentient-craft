/**
 * PURPOSE: Defines the input schema for the MCP signal-back tool
 *
 * USAGE:
 * const input = signalBackInputContract.parse({ signal: 'complete', stepId: '...', summary: '...' });
 * // Returns validated signal-back input (one of 4 signal types)
 */
import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

// NOTE: MCP requires inputSchema to have type: "object" at root level.
// z.discriminatedUnion produces "anyOf" which breaks MCP tool loading.
// Using single object with optional fields for MCP compatibility.
// Validation of required fields per signal type is done in the broker.
// NOTE: 'needs-user-input' signal was removed - agents should make autonomous decisions
export const signalBackInputContract = z.object({
  signal: z
    .enum(['complete', 'partially-complete', 'needs-role-followup'])
    .describe('Signal type indicating step status'),
  stepId: stepIdContract.describe('The ID of the step being signaled'),
  // Fields for 'complete' signal
  summary: z
    .string()
    .min(1)
    .brand<'SignalSummary'>()
    .describe('Summary of what was completed (for complete signal)')
    .optional(),
  // Fields for 'partially-complete' signal
  progress: z
    .string()
    .min(1)
    .brand<'SignalProgress'>()
    .describe('Description of progress made (for partially-complete signal)')
    .optional(),
  continuationPoint: z
    .string()
    .min(1)
    .brand<'SignalContinuationPoint'>()
    .describe('Where to resume work (for partially-complete signal)')
    .optional(),
  // Fields for 'needs-role-followup' signal
  context: z
    .string()
    .min(1)
    .brand<'SignalContext'>()
    .describe('Context for the followup (for needs-role-followup signal)')
    .optional(),
  targetRole: z
    .string()
    .min(1)
    .brand<'SignalTargetRole'>()
    .describe('Role that should handle the followup (for needs-role-followup signal)')
    .optional(),
  reason: z
    .string()
    .min(1)
    .brand<'SignalReason'>()
    .describe('Reason for needing followup (for needs-role-followup signal)')
    .optional(),
  resume: z
    .boolean()
    .brand<'SignalResume'>()
    .describe('Whether to resume after followup (for needs-role-followup signal)')
    .optional(),
});

export type SignalBackInput = z.infer<typeof signalBackInputContract>;
