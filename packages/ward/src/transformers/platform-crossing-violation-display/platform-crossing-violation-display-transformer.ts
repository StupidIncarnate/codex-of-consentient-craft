/**
 * PURPOSE: Renders one `PlatformCrossingViolation` as the two-line block a reader acts on — the
 * whole import chain on one arrow-joined line, then which gateway package is missing and why. This
 * is the ONLY place that string is built, so a report and a test asserting on it can never drift.
 *
 * USAGE:
 * platformCrossingViolationDisplayTransformer({violation: PlatformCrossingViolationStub()});
 * // Returns: 'web (browser) → @dungeonmaster/node/fs\n@dungeonmaster/node is not available in a browser package'
 */

import type { PlatformCrossingViolation } from '../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import { platformCrossingDisplayTextContract } from '../../contracts/platform-crossing-display-text/platform-crossing-display-text-contract';
import type { PlatformCrossingDisplayText } from '../../contracts/platform-crossing-display-text/platform-crossing-display-text-contract';

export const platformCrossingViolationDisplayTransformer = ({
  violation,
}: {
  violation: PlatformCrossingViolation;
}): PlatformCrossingDisplayText => {
  const chainLine = [`${violation.packageName} (${violation.platform})`, ...violation.chain].join(
    ' → ',
  );
  const messageLine = `${violation.crossedGatewayPackage} is not available in a ${violation.platform} package`;

  return platformCrossingDisplayTextContract.parse(`${chainLine}\n${messageLine}`);
};
