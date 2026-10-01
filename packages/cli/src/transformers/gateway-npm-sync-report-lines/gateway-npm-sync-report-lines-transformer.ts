/**
 * PURPOSE: Turns an npm-gateway sync report into the short lines a person or an agent reads — one
 * `<kind>: <names>` line per non-empty list, one `passthrough instead of our wrapper:` line per
 * package dungeonmaster has a wrapper for but did not copy (naming the installed version and our
 * range when that was the reason, and the first compiler diagnostic when compiling was), one line
 * naming the packages with no root export that got nothing, then the lockfile warning when there is one, and no lines at all
 * when the sync had nothing to do. `dungeonmaster gateway-sync` prints them, and `init`'s gateway
 * step folds them into its result message, so both say the same thing about the same run.
 *
 * USAGE:
 * gatewayNpmSyncReportLinesTransformer({ report: GatewayNpmSyncReportStub({ generated: ['zod'], skippedOwnCopy: [GatewayNpmSkippedOwnCopyStub({ installed: '3.23.8', ours: '^4.6.5' })] }) });
 * // Returns ['generated: zod', 'passthrough instead of our wrapper: zod (installed 3.23.8, ours ^4.6.5)']
 */

import type { GatewayNpmSyncReport } from '../../contracts/gateway-npm-sync-report/gateway-npm-sync-report-contract';

const SKIPPED_PREFIX = 'passthrough instead of our wrapper';

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

  return [
    ...sections
      .filter(([, names]) => names.length > 0)
      .map(([kind, names]) => `${kind}: ${names.join(', ')}`),
    ...report.skippedOwnCopy.map(({ name, reason, installed, ours, detail }) => {
      const installedText = installed === undefined ? 'not installed' : `installed ${installed}`;
      const explanation =
        reason === 'version'
          ? `${installedText}, ours ${ours ?? 'not declared'}`
          : reason === 'compile'
            ? `our wrapper does not compile against ${installedText}${detail === undefined ? '' : `: ${detail}`}`
            : reason === 'esm-only'
              ? 'our wrapper imports an ESM-only package'
              : 'our wrapper imports a package this repo does not declare';
      return `${SKIPPED_PREFIX}: ${name} (${explanation})`;
    }),
    ...(report.noRootExport.length === 0
      ? []
      : [`no root export; wrap a subpath by hand: ${report.noRootExport.join(', ')}`]),
    ...(report.lockfileWarning === undefined ? [] : [report.lockfileWarning]),
  ];
};
