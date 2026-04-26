/**
 * PURPOSE: Parses an unknown response body to a typed HealthResponse via the contract, returning undefined on failure
 *
 * USAGE:
 * const parsed = parseHealthResponseTransformer({ value });
 * // Returns: HealthResponse | undefined
 */

import { healthResponseContract } from '../../contracts/health-response/health-response-contract';
import type { HealthResponse } from '../../contracts/health-response/health-response-contract';

export const parseHealthResponseTransformer = ({
  value,
}: {
  value: unknown;
}): HealthResponse | undefined => {
  const result = healthResponseContract.safeParse(value);
  return result.success ? result.data : undefined;
};
