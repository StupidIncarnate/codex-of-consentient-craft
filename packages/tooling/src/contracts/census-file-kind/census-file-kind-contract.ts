/**
 * PURPOSE: Sorts a repo file by the role it plays for the census: a barrel at a package root is neither a caller nor a subject, and a proxy, test, stub or harness never counts as a production caller.
 *
 * USAGE:
 * censusFileKindContract.parse('production');
 * // Returns: CensusFileKind
 */
import { z } from '#gateway/npm/zod';

export const censusFileKindContract = z.enum([
  'production',
  'proxy',
  'test',
  'stub',
  'harness',
  'barrel',
  'other',
]);

export type CensusFileKind = z.infer<typeof censusFileKindContract>;
