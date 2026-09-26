/**
 * PURPOSE: Renders the whole platform-crossing run — every violation's display block, blank-line
 * separated, or a single clean-run line when the walk found none. `commandPlatformCheckBroker`
 * writes exactly this string to stdout, so the report a person reads and the string a test asserts
 * on are the same value.
 *
 * USAGE:
 * platformCrossingReportTransformer({violations: []});
 * // Returns: 'platform-crossing: PASS — no browser package reaches a node/bin gateway import, and no node-platform package reaches a browser gateway import.'
 */

import type { PlatformCrossingViolation } from '../../contracts/platform-crossing-violation/platform-crossing-violation-contract';
import { platformCrossingDisplayTextContract } from '../../contracts/platform-crossing-display-text/platform-crossing-display-text-contract';
import type { PlatformCrossingDisplayText } from '../../contracts/platform-crossing-display-text/platform-crossing-display-text-contract';
import { platformCrossingViolationDisplayTransformer } from '../platform-crossing-violation-display/platform-crossing-violation-display-transformer';

const CLEAN_RUN_MESSAGE =
  'platform-crossing: PASS — no browser package reaches a node/bin gateway import, and no ' +
  'node-platform package reaches a browser gateway import.';

export const platformCrossingReportTransformer = ({
  violations,
}: {
  violations: readonly PlatformCrossingViolation[];
}): PlatformCrossingDisplayText => {
  if (violations.length === 0) {
    return platformCrossingDisplayTextContract.parse(CLEAN_RUN_MESSAGE);
  }

  const blocks = violations.map((violation) =>
    platformCrossingViolationDisplayTransformer({ violation }),
  );

  return platformCrossingDisplayTextContract.parse(
    `platform-crossing: FAIL — ${violations.length} crossing(s) found\n\n${blocks.join('\n\n')}`,
  );
};
