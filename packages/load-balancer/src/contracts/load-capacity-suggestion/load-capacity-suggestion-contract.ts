/**
 * PURPOSE: Defines the validated capacity suggestion schema containing the recommended concurrent
 * worker count and individual resource limits (CPU, free memory, memory cap). Reach for this
 * over siegelense capacitySuggestionContract when planning general jobs with memory and lease constraints
 * across tools rather than browser siege test instances.
 *
 * USAGE:
 * loadCapacitySuggestionContract.parse({
 *   suggestion: 2,
 *   cpuLimit: 4,
 *   freeMemoryLimit: 2,
 *   capMemoryLimit: 3,
 * });
 * // Returns: LoadCapacitySuggestion
 */

import { z } from '#gateway/npm/zod';

export const loadCapacitySuggestionContract = z
  .object({
    suggestion: z.number().int().nonnegative().brand<'LoadCapacitySuggestionSuggestion'>(),
    cpuLimit: z.number().int().nonnegative().brand<'LoadCapacitySuggestionCpuLimit'>(),
    freeMemoryLimit: z
      .number()
      .int()
      .nonnegative()
      .brand<'LoadCapacitySuggestionFreeMemoryLimit'>()
      .nullable(),
    capMemoryLimit: z
      .number()
      .int()
      .nonnegative()
      .brand<'LoadCapacitySuggestionCapMemoryLimit'>()
      .nullable(),
  })
  .brand<'LoadCapacitySuggestion'>();

export type LoadCapacitySuggestion = z.infer<typeof loadCapacitySuggestionContract>;
