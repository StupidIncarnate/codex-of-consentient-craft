/**
 * PURPOSE: Defines the structure of CLI signal file content
 *
 * USAGE:
 * const signal = signalContentContract.parse({ type: 'quest-complete', questId: 'abc-123' });
 * const returnSignal = signalContentContract.parse({ action: 'return', screen: 'list', timestamp: '...' });
 * // Returns validated SignalContent object (either quest signal or return signal)
 */

import { z } from 'zod';

// Quest-related signals from the agent
const questSignalContract = z.object({
  type: z.enum(['quest-complete', 'quest-error', 'agent-ready']).brand<'SignalType'>(),
  questId: z.string().brand<'QuestId'>().optional(),
  message: z.string().brand<'SignalMessage'>().optional(),
});

// Return signal from MCP to hand control back to CLI
const returnSignalContract = z.object({
  action: z.literal('return').brand<'SignalAction'>(),
  screen: z.enum(['menu', 'list']).brand<'SignalScreen'>(),
  timestamp: z.string().brand<'Timestamp'>(),
});

export const signalContentContract = z.union([questSignalContract, returnSignalContract]);

export type SignalContent = z.infer<typeof signalContentContract>;
export type QuestSignal = z.infer<typeof questSignalContract>;
export type ReturnSignal = z.infer<typeof returnSignalContract>;
