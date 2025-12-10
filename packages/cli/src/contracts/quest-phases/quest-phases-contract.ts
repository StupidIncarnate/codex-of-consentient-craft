/**
 * PURPOSE: Defines the structure of all phases in a quest
 *
 * USAGE:
 * questPhasesContract.parse({discovery: {...}, implementation: {...}, ...});
 * // Returns: QuestPhases object
 */

import { z } from 'zod';

import { questPhaseContract } from '../quest-phase/quest-phase-contract';

export const questPhasesContract = z.object({
  discovery: questPhaseContract,
  implementation: questPhaseContract,
  testing: questPhaseContract,
  review: questPhaseContract,
});

export type QuestPhases = z.infer<typeof questPhasesContract>;
