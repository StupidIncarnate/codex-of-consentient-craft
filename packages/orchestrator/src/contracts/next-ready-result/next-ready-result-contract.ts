/**
 * PURPOSE: Defines the result type for the next-ready-work-items transformer
 *
 * USAGE:
 * const result: NextReadyResult = { ready: [], questTerminal: true, questBlocked: false };
 * // Returned by nextReadyWorkItemsTransformer
 */

import { z } from 'zod';

import { workItemContract } from '@dungeonmaster/shared/contracts';

export const nextReadyResultContract = z.object({
  ready: z.array(workItemContract),
  questTerminal: z.boolean(),
  questBlocked: z.boolean(),
});

export type NextReadyResult = z.infer<typeof nextReadyResultContract>;
