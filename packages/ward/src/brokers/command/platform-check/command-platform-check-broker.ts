/**
 * PURPOSE: Runs the platform-crossing check over the whole repo and writes its report to stdout,
 * setting a failing exit code when it finds a crossing. This is the one command surface the check
 * has today — see `scrolls/gateway/followup-sustainability.md` item 30 for what full ward check-type integration
 * (a `platform` entry in `checkTypeContract`, `--only platform`, storage/list/detail) would still
 * need.
 *
 * USAGE:
 * await commandPlatformCheckBroker({ rootPath: filePathContract.parse('/repo') });
 * // Writes the platform-crossing report to stdout; sets a failing exit code if any crossing was found
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { platformCrossingCheckBroker } from '../../platform-crossing/check/platform-crossing-check-broker';
import { platformCrossingReportTransformer } from '../../../transformers/platform-crossing-report/platform-crossing-report-transformer';

export const commandPlatformCheckBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const violations = await platformCrossingCheckBroker({
    rootPath: filePathContract.parse(rootPath),
  });
  const report = platformCrossingReportTransformer({ violations });

  process.stdout.write(`${report}\n`);

  if (violations.length > 0) {
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
  }

  return adapterResultContract.parse({ success: true });
};
