/**
 * PURPOSE: Zod schema for session-start responder result with optional content to output
 *
 * USAGE:
 * const result = hookSessionStartResponderResultContract.parse({ shouldOutput: true, content: "..." });
 * // Returns validated HookSessionStartResponderResult
 */
import { z } from 'zod';

export const hookSessionStartResponderResultContract = z.object({
  shouldOutput: z.boolean(),
  content: z.string().optional(),
});

export type HookSessionStartResponderResult = z.infer<
  typeof hookSessionStartResponderResultContract
>;
