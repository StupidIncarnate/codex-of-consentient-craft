/**
 * PURPOSE: Defines the structure for temporary session items displayed in the quest list before quest creation
 *
 * USAGE:
 * tempSessionItemContract.parse({sessionId: '9c4d8f1c-...', title: 'Fix auth bug', startedAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: TempSessionItem object
 */

import { z } from 'zod';

import { sessionIdContract } from '@dungeonmaster/shared/contracts';

export const tempSessionItemContract = z.object({
  sessionId: sessionIdContract,
  title: z.string().brand<'SessionSummary'>().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type TempSessionItem = z.infer<typeof tempSessionItemContract>;
