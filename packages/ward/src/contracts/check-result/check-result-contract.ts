/**
 * PURPOSE: Defines the result of a single check type across all projects
 *
 * USAGE:
 * checkResultContract.parse({checkType: 'lint', status: 'pass', projectResults: []});
 * // Returns: CheckResult validated object
 */

import { z } from 'zod';
import { checkTypeContract } from '../check-type/check-type-contract';
import { checkStatusContract } from '../check-status/check-status-contract';
import { projectResultContract } from '../project-result/project-result-contract';
import { durationMsContract } from '../duration-ms/duration-ms-contract';

export const checkResultContract = z.object({
  checkType: checkTypeContract,
  status: checkStatusContract,
  projectResults: z.array(projectResultContract),
  durationMs: durationMsContract.default(0),
});

export type CheckResult = z.infer<typeof checkResultContract>;
