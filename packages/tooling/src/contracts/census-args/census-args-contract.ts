/**
 * PURPOSE: The parsed command line of `adapter-census`: where to scan (absent means the current
 * directory), how to print, and an optional package to keep.
 *
 * USAGE:
 * censusArgsContract.parse({ format: 'json', packageFilter: 'siegelense' });
 * // Returns: CensusArgs
 */
import { z } from 'zod';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { censusFormatContract } from '../census-format/census-format-contract';

export const censusArgsContract = z.object({
  cwd: absoluteFilePathContract.optional(),
  format: censusFormatContract,
  packageFilter: z.string().min(1).brand<'CensusPackageFilter'>().optional(),
});

export type CensusArgs = z.infer<typeof censusArgsContract>;
