/**
 * PURPOSE: Renders the whole duplicate-install run — every violation's block, blank-line separated,
 * or a single clean-run line when none were found. `commandDedupeCheckBroker` writes exactly this
 * string to stdout, so the report a person reads and the string a test asserts on are the same value.
 *
 * USAGE:
 * duplicateInstallReportTransformer({violations: []});
 * // Returns: 'duplicate-install: PASS — no gateway dependency resolves to more than one top-level node_modules copy.'
 */

import type { DuplicateInstallViolation } from '../../contracts/duplicate-install-violation/duplicate-install-violation-contract';
import { duplicateInstallDisplayTextContract } from '../../contracts/duplicate-install-display-text/duplicate-install-display-text-contract';
import type { DuplicateInstallDisplayText } from '../../contracts/duplicate-install-display-text/duplicate-install-display-text-contract';
import { duplicateInstallViolationDisplayTransformer } from '../duplicate-install-violation-display/duplicate-install-violation-display-transformer';

const CLEAN_RUN_MESSAGE =
  'duplicate-install: PASS — no gateway dependency resolves to more than one top-level ' +
  'node_modules copy.';

export const duplicateInstallReportTransformer = ({
  violations,
}: {
  violations: readonly DuplicateInstallViolation[];
}): DuplicateInstallDisplayText => {
  if (violations.length === 0) {
    return duplicateInstallDisplayTextContract.parse(CLEAN_RUN_MESSAGE);
  }

  const blocks = violations.map((violation) =>
    duplicateInstallViolationDisplayTransformer({ violation }),
  );

  return duplicateInstallDisplayTextContract.parse(
    `duplicate-install: FAIL — ${violations.length} package(s) with more than one install\n\n${blocks.join('\n\n')}`,
  );
};
