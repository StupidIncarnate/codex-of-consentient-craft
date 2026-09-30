/**
 * PURPOSE: What one package's scan found: its violation count and the hits grouped into hand-queue
 * batches. Reach for this over a flat violation list when sizing work, since each batch is one unit
 * an agent takes and a file's hits never split across two of them.
 *
 * USAGE:
 * scanPackageResultContract.parse({ name: '@dungeonmaster/ward', violations: 0, batches: [] });
 * // Returns: ScanPackageResult validated object
 */

import { z } from '#gateway/npm/zod';

import { scanViolationContract } from '../scan-violation/scan-violation-contract';

export const scanPackageResultContract = z.object({
  name: z.string().min(1).brand<'ScanPackageName'>(),
  violations: z.number().int().min(0).brand<'ScanViolationCount'>(),
  batches: z.array(z.array(scanViolationContract).min(1)),
}).brand<'ScanPackageResult'>();

export type ScanPackageResult = z.infer<typeof scanPackageResultContract>;
