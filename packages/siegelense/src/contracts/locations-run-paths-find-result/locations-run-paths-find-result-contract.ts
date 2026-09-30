/**
 * PURPOSE: Defines the data `locationsRunPathsFindBroker` returns
 *
 * USAGE:
 * locationsRunPathsFindResultContract.parse(value);
 * // Returns validated LocationsRunPathsFindResult
 */
import { z } from '#gateway/npm/zod';

export const locationsRunPathsFindResultContract = z
  .object({
    transcript: z.string().brand<'LocationsRunPathsFindResultTranscript'>(),
    storedReturn: z.string().brand<'LocationsRunPathsFindResultStoredReturn'>(),
    shotsDir: z.string().brand<'LocationsRunPathsFindResultShotsDir'>(),
  })
  .brand<'LocationsRunPathsFindResult'>();

export type LocationsRunPathsFindResult = z.infer<typeof locationsRunPathsFindResultContract>;
