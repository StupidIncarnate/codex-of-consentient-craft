/**
 * PURPOSE: The parsed `ward scan` command line: the rule to force to error and the optional paths
 * that narrow which packages and files are scanned. Reach for this over `WardConfig`, which
 * describes check runs and has no rule.
 *
 * USAGE:
 * scanConfigContract.parse({ rule: 'no-console', paths: ['packages/ward'] });
 * // Returns: ScanConfig validated object
 */

import { z } from '#gateway/npm/zod';


export const scanConfigContract = z.object({
  rule: z.string().min(1).regex(/^\S+$/u).brand<'ScanConfigRule'>(),
  paths: z.array(z.string().brand<'ScanConfigPaths'>()),
}).brand<'ScanConfig'>();

export type ScanConfig = z.infer<typeof scanConfigContract>;
