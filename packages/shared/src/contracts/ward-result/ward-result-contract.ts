/**
 * PURPOSE: Lightweight ward result ref stored in quest.json — full detail lives in quest folder
 *
 * USAGE:
 * wardResultContract.parse({id: 'f47ac10b-...', createdAt: '2024-01-15T10:00:00.000Z', exitCode: 0});
 * // Returns: WardResult object (lightweight ref, detail in {questFolder}/ward-results/{id}.json)
 */

import { z } from 'zod';

export const wardResultContract = z.object({
  id: z.string().uuid().brand<'WardResultId'>(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  exitCode: z.number().int().brand<'ExitCode'>(),
  runId: z.string().brand<'WardRunId'>().optional(),
  wardMode: z.enum(['changed', 'full']).optional(),
});

export type WardResult = z.infer<typeof wardResultContract>;
