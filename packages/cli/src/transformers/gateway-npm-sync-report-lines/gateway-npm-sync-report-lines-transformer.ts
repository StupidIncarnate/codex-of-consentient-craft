/**
 * PURPOSE: Turns an npm-gateway sync report into the short lines a person or an agent reads — one
 * `<kind>: <names>` line per non-empty list, and no lines at all when the sync had nothing to do.
 * `dungeonmaster gateway-sync` prints them, and `init`'s gateway step folds them into its result
 * message, so both say the same thing about the same run.
 *
 * USAGE:
 * gatewayNpmSyncReportLinesTransformer({ report: GatewayNpmSyncReportStub({ generated: ['left-pad'], untyped: ['left-pad'] }) });
 * // Returns ['generated: left-pad', 'untyped: left-pad']
 */

import type { GatewayNpmSyncReport } from '../../contracts/gateway-npm-sync-report/gateway-npm-sync-report-contract';

export const gatewayNpmSyncReportLinesTransformer = ({
  report,
}: {
  report: GatewayNpmSyncReport;
}): string[] => {
  const sections: [string, readonly string[]][] = [
    ['copied', report.copied],
    ['generated', report.generated],
    ['untyped', report.untyped],
    ['esm-only (types only; wrap runtime values with import())', report.esmOnly],
  ];

  return sections
    .filter(([, names]) => names.length > 0)
    .map(([kind, names]) => `${kind}: ${names.join(', ')}`);
};
