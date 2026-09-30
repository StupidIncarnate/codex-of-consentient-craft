/**
 * PURPOSE: Renders one `DuplicateInstallViolation` as the block a reader acts on — the package name,
 * every location it resolved at with the version installed there, then the fix. This is the ONLY
 * place that string is built, so a report and a test asserting on it can never drift.
 *
 * USAGE:
 * duplicateInstallViolationDisplayTransformer({violation: DuplicateInstallViolationStub()});
 * // Returns:
 * // '@mantine/core installed at 2 locations:\n' +
 * // '  packages/@gateway/npm/node_modules/@mantine/core (8.3.18)\n' +
 * // '  packages/web/node_modules/@mantine/core (8.3.14)\n' +
 * // 'Run `npm dedupe`, then align version ranges if a duplicate remains.'
 */

import type { DuplicateInstallViolation } from '../../contracts/duplicate-install-violation/duplicate-install-violation-contract';

const FIX_LINE = 'Run `npm dedupe`, then align version ranges if a duplicate remains.';

export const duplicateInstallViolationDisplayTransformer = ({
  violation,
}: {
  violation: DuplicateInstallViolation;
}): string => {
  const headerLine = `${violation.packageName} installed at ${violation.locations.length} locations:`;
  const locationLines = violation.locations.map(
    (location) => `  ${location.location} (${location.version})`,
  );

  return [headerLine, ...locationLines, FIX_LINE].join('\n');
};
