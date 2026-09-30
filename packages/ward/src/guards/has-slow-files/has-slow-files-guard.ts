/**
 * PURPOSE: Answers whether any check in a finished run called a suite slow. Reach for this to decide
 * the run's EXIT CODE; `slowFileTimingsTransformer` is what decides which suites those are, and this
 * asks it rather than repeating the rule, so the list ward prints and the list ward fails on cannot
 * drift apart.
 *
 * USAGE:
 * hasSlowFilesGuard({wardResult: WardResultStub()});
 * // Returns true when at least one suite is over threshold
 */

import type { WardResult } from '../../contracts/ward-result/ward-result-contract';
import { slowFileTimingsTransformer } from '../../transformers/slow-file-timings/slow-file-timings-transformer';

export const hasSlowFilesGuard = ({ wardResult }: { wardResult?: WardResult }): boolean => {
  if (!wardResult) {
    return false;
  }

  return wardResult.checks.some((check) => slowFileTimingsTransformer({ check }).length > 0);
};
