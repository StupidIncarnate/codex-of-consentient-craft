/**
 * PURPOSE: Defines work unit for Lawbringer containing implementation and test file paths
 *
 * USAGE:
 * filePairWorkUnitContract.parse({implPath: '/src/broker.ts', testPath: '/src/broker.test.ts'});
 * // Returns: FilePairWorkUnit object for Lawbringer to review
 */

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const filePairWorkUnitContract = z.object({
  implPath: absoluteFilePathContract,
  testPath: absoluteFilePathContract,
});

export type FilePairWorkUnit = z.infer<typeof filePairWorkUnitContract>;
