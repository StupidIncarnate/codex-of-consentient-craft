/**
 * PURPOSE: Defines a branded non-negative integer for an execution "replan generation" — 0 is the
 *   original wave, 1.. is each successive replan re-entry (a PathSeeker spliced by a failure).
 *
 * USAGE:
 * floorGenerationContract.parse(0);
 * // Returns: FloorGeneration branded number
 */

import { z } from 'zod';

export const floorGenerationContract = z.number().int().nonnegative().brand<'FloorGeneration'>();

export type FloorGeneration = z.infer<typeof floorGenerationContract>;
