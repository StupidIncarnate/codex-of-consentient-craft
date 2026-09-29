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

import { cliArgContract } from '../cli-arg/cli-arg-contract';
import { scanRuleNameContract } from '../scan-rule-name/scan-rule-name-contract';

export const scanConfigContract = z.object({
  rule: scanRuleNameContract,
  paths: z.array(cliArgContract),
});

export type ScanConfig = z.infer<typeof scanConfigContract>;
