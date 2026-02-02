/**
 * PURPOSE: Defines the structure of a signal extracted from Claude stream-json output
 *
 * USAGE:
 * const signal = streamSignalContract.parse({ signal: 'complete', stepId: '...', summary: '...' });
 * // Returns validated StreamSignal from agent's MCP tool call
 */

import { z } from 'zod';
import { stepIdContract } from '@dungeonmaster/shared/contracts';

// Mirror of MCP's signalBackInputContract for local validation
// MCP requires single object with optional fields (discriminatedUnion breaks MCP)
export const streamSignalContract = z.object({
  signal: z.enum(['complete', 'partially-complete', 'needs-user-input', 'needs-role-followup']),
  stepId: stepIdContract,
  // Fields for 'complete' signal
  summary: z.string().min(1).brand<'SignalSummary'>().optional(),
  // Fields for 'partially-complete' signal
  progress: z.string().min(1).brand<'SignalProgress'>().optional(),
  continuationPoint: z.string().min(1).brand<'SignalContinuationPoint'>().optional(),
  // Fields for 'needs-user-input' signal
  question: z.string().min(1).brand<'SignalQuestion'>().optional(),
  // Fields for 'needs-user-input' and 'needs-role-followup' signals
  context: z.string().min(1).brand<'SignalContext'>().optional(),
  // Fields for 'needs-role-followup' signal
  targetRole: z.string().min(1).brand<'SignalTargetRole'>().optional(),
  reason: z.string().min(1).brand<'SignalReason'>().optional(),
  resume: z.boolean().brand<'SignalResume'>().optional(),
});

export type StreamSignal = z.infer<typeof streamSignalContract>;
