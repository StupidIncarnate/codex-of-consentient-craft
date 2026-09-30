/**
 * PURPOSE: Defines the data `locationsProfileDirsFindBroker` returns
 *
 * USAGE:
 * locationsProfileDirsFindResultContract.parse(value);
 * // Returns validated LocationsProfileDirsFindResult
 */
import { z } from '#gateway/npm/zod';

export const locationsProfileDirsFindResultContract = z
  .object({
    samplesDir: z.string().brand<'LocationsProfileDirsFindResultSamplesDir'>(),
    bootsDir: z.string().brand<'LocationsProfileDirsFindResultBootsDir'>(),
  })
  .brand<'LocationsProfileDirsFindResult'>();

export type LocationsProfileDirsFindResult = z.infer<typeof locationsProfileDirsFindResultContract>;
