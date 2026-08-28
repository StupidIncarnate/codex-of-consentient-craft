/**
 * PURPOSE: Safe-parses an unknown HTTP body into the shared HealthStatusPayload shape, so this
 * flow's own integration test can prove response shape without importing a contract directly —
 * ban-contract-in-tests forbids that import from a flow's test file.
 *
 * USAGE:
 * const parsed = parseHealthStatusPayloadTransformer({ value });
 * // Returns: HealthStatusPayload | undefined
 */

import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

export const parseHealthStatusPayloadTransformer = ({
  value,
}: {
  value: unknown;
}): HealthStatusPayload | undefined => {
  const result = healthStatusPayloadContract.safeParse(value);
  return result.success ? result.data : undefined;
};
