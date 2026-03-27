/**
 * PURPOSE: Defines a per-file timing entry extracted from tool output
 *
 * USAGE:
 * fileTimingContract.parse({filePath: 'src/index.ts', durationMs: 150});
 * // Returns: FileTiming validated object
 */

import { z } from 'zod';
import { gitRelativePathContract } from '../git-relative-path/git-relative-path-contract';
import { durationMsContract } from '../duration-ms/duration-ms-contract';

export const fileTimingContract = z.object({
  filePath: gitRelativePathContract,
  durationMs: durationMsContract,
});

export type FileTiming = z.infer<typeof fileTimingContract>;
