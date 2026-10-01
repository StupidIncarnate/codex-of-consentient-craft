/**
 * PURPOSE: `dungeonmaster gateway-sync` — runs the npm-gateway sync for the repo the command was
 * started in and prints what it did, one short line per list. The root `postinstall` and the agent
 * hook after `npm install <pkg>` both run it, and the hook hands its stdout straight to the agent,
 * so the output stays a few lines. The start directory may be any folder inside the repo (a Claude
 * Code session sitting in `packages/<x>`), so the repo root is the nearest ancestor holding
 * `.dungeonmaster.json`, found the way every other dungeonmaster entry point finds it. With no such
 * folder, a run npm started as the root `postinstall` (`npm_lifecycle_event=postinstall`) prints one
 * notice and succeeds, so an install outside an initialised repo still completes; run any other way
 * it fails. A lockfile refresh that failed after the folders were written is a printed warning line,
not a failure. Every other failure propagates to the bin entry, which prints it and exits 1.
 *
 * USAGE:
 * await CliGatewaySyncResponder({ context });
 * // Writes 'gateway-sync: packages/@gateway/npm/src/\n  generated: left-pad\n', or 'gateway-sync: nothing to do\n'
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import type { InstallContext } from '@dungeonmaster/shared/contracts';
import { getEnv, stdout } from '#gateway/node/process';

import { gatewayNpmSyncBroker } from '../../../brokers/gateway/npm-sync/gateway-npm-sync-broker';
import {
  gatewayNpmSyncReportContract,
  type GatewayNpmSyncReport,
} from '../../../contracts/gateway-npm-sync-report/gateway-npm-sync-report-contract';
import { rootPostinstallStatics } from '../../../statics/root-postinstall/root-postinstall-statics';
import { gatewayNpmSyncReportLinesTransformer } from '../../../transformers/gateway-npm-sync-report-lines/gateway-npm-sync-report-lines-transformer';

export const CliGatewaySyncResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<GatewayNpmSyncReport> => {
  const startPath = context.targetProjectRoot;
  const { lifecycle } = rootPostinstallStatics;
  const repoRoot = await cwdResolveBroker({ startPath, kind: 'repo-root' }).catch(
    (error: unknown) => {
      if (getEnv(lifecycle.envName) === lifecycle.postinstallValue) {
        return null;
      }
      throw new Error(
        `gateway-sync found no .dungeonmaster.json in ${startPath} or any folder above it. Run it inside a repo \`dungeonmaster init\` has set up.`,
        { cause: error },
      );
    },
  );

  if (repoRoot === null) {
    stdout.write(
      `gateway-sync: skipped, no .dungeonmaster.json in ${startPath} or any folder above it\n`,
    );
    return gatewayNpmSyncReportContract.parse({
      copied: [],
      generated: [],
      untyped: [],
      esmOnly: [],
      skippedOwnCopy: [],
      noRootExport: [],
    });
  }

  const report = await gatewayNpmSyncBroker({ repoRoot });
  const lines = gatewayNpmSyncReportLinesTransformer({ report });

  stdout.write(
    lines.length === 0
      ? 'gateway-sync: nothing to do\n'
      : `gateway-sync: packages/@gateway/npm/src/\n${lines.map((line) => `  ${line}\n`).join('')}`,
  );

  return report;
};
