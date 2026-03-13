/**
 * PURPOSE: Defines the result structure from the siegemaster phase including failed observable IDs
 *
 * USAGE:
 * siegemasterPhaseResultContract.parse({ failedObservableIds: [] });
 * // Returns: SiegemasterPhaseResult object
 */

import { z } from 'zod';
import { observableIdContract } from '@dungeonmaster/shared/contracts';

export const siegemasterPhaseResultContract = z.object({
  failedObservableIds: z.array(observableIdContract),
});

export type SiegemasterPhaseResult = z.infer<typeof siegemasterPhaseResultContract>;
