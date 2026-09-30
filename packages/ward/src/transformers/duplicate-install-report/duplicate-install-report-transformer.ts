/**
 * PURPOSE: Renders the whole duplicate-install run — every violation's block, blank-line separated,
 * or a single clean-run line when none were found — as the one string a whole-run report and a test
 * asserting on it both share. `platformDedupeCheckLayerBroker` reports one `ErrorEntry` per
 * violation instead (`ward` folds each into the `lint` check individually), so nothing in `ward`
 * currently calls this; it stays as the shared renderer for a caller that wants the whole run as one
 * block rather than one entry per violation.
 *
 * USAGE:
 * duplicateInstallReportTransformer({violations: []});
 * // Returns: 'duplicate-install: PASS — no gateway dependency resolves to more than one top-level node_modules copy.'
 */

import type { DuplicateInstallViolation } from '../../contracts/duplicate-install-violation/duplicate-install-violation-contract';
import { duplicateInstallViolationDisplayTransformer } from '../duplicate-install-violation-display/duplicate-install-violation-display-transformer';

const CLEAN_RUN_MESSAGE =
  'duplicate-install: PASS — no gateway dependency resolves to more than one top-level ' +
  'node_modules copy.';

export const duplicateInstallReportTransformer = ({
  violations,
}: {
  violations: readonly DuplicateInstallViolation[];
}): string => {
  if (violations.length === 0) {
    return CLEAN_RUN_MESSAGE;
  }

  const blocks = violations.map((violation) =>
    duplicateInstallViolationDisplayTransformer({ violation }),
  );

  return `duplicate-install: FAIL — ${violations.length} package(s) with more than one install\n\n${blocks.join('\n\n')}`;
};
