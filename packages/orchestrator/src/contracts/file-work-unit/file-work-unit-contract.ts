/**
 * PURPOSE: Defines work unit for Spiritmender containing file path and errors array
 *
 * USAGE:
 * fileWorkUnitContract.parse({filePath: '/src/file.ts', errors: ['Missing return type']});
 * // Returns: FileWorkUnit object for Spiritmender to fix
 */

import { absoluteFilePathContract, errorMessageContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const fileWorkUnitContract = z.object({
  filePath: absoluteFilePathContract,
  errors: z.array(errorMessageContract),
});

export type FileWorkUnit = z.infer<typeof fileWorkUnitContract>;
