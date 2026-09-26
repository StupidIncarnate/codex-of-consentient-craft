/**
 * PURPOSE: Drops a violation the walk already reported through a different starting file — the
 * same package, platform and chain reached twice because two production files both import the same
 * crossing broker. Keeps the FIRST occurrence, so which duplicate survives is deterministic
 * (discovery order), not incidental to how `Promise.all` happened to settle.
 *
 * USAGE:
 * dedupePlatformCrossingViolationsTransformer({violations: [PlatformCrossingViolationStub(), PlatformCrossingViolationStub()]});
 * // Returns: [PlatformCrossingViolationStub()]
 */

import type { PlatformCrossingViolation } from '../../contracts/platform-crossing-violation/platform-crossing-violation-contract';

export const dedupePlatformCrossingViolationsTransformer = ({
  violations,
}: {
  violations: readonly PlatformCrossingViolation[];
}): readonly PlatformCrossingViolation[] => {
  const seenKeys = new Set();

  return violations.filter((violation) => {
    const key = `${violation.packageName}::${violation.platform}::${violation.chain.join('>')}`;
    if (seenKeys.has(key)) {
      return false;
    }
    seenKeys.add(key);
    return true;
  });
};
