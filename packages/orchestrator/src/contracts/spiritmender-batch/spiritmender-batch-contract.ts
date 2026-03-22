/**
 * PURPOSE: Defines the structure of a spiritmender batch containing file paths and their errors
 *
 * USAGE:
 * spiritmenderBatchContract.parse({ filePaths: ['/src/file.ts'], errors: ['line 5: error'] });
 * // Returns validated SpiritmenderBatch
 */

import { z } from 'zod';
import { absoluteFilePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';

export const spiritmenderBatchContract = z.object({
  filePaths: z.array(absoluteFilePathContract),
  errors: z.array(errorMessageContract),
});

export type SpiritmenderBatch = z.infer<typeof spiritmenderBatchContract>;
