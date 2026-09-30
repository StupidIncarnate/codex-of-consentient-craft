/**
 * PURPOSE: The whole document `ward scan` prints: the rule scanned and one result per scanned
 * package. Reach for this over a package result when the reader needs to know which rule the
 * numbers belong to.
 *
 * USAGE:
 * scanReportContract.parse({ rule: '@dungeonmaster/ban-primitives', packages: [] });
 * // Returns: ScanReport validated object
 */

import { z } from '#gateway/npm/zod';

import { scanPackageResultContract } from '../scan-package-result/scan-package-result-contract';

export const scanReportContract = z.object({
  rule: z.string().min(1).regex(/^\S+$/u).brand<'ScanReportRule'>(),
  packages: z.array(scanPackageResultContract),
}).brand<'ScanReport'>();

export type ScanReport = z.infer<typeof scanReportContract>;
