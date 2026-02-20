/**
 * PURPOSE: Defines the response contract for the guild session resolve API endpoint
 *
 * USAGE:
 * sessionResolveResponseContract.parse({questId: 'add-auth'});
 * // Returns validated {questId: QuestId | null} object
 */

import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

export const sessionResolveResponseContract = z.object({
  questId: questIdContract.nullable(),
});

export type SessionResolveResponse = z.infer<typeof sessionResolveResponseContract>;
