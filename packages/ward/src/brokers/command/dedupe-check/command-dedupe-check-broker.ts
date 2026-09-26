/**
 * PURPOSE: Runs the duplicate-install check over the whole repo and writes its report to stdout,
 * setting a failing exit code when it finds a duplicate. This is the one command surface the check
 * has today, the same shape `commandPlatformCheckBroker` chose for the platform-crossing check — see
 * `scrolls/gateway-build/followups.md` for what full ward check-type integration (a `dedupe` entry in
 * `checkTypeContract`, `--only dedupe`, storage/list/detail) would still need.
 *
 * USAGE:
 * await commandDedupeCheckBroker({ rootPath: filePathContract.parse('/repo') });
 * // Writes the duplicate-install report to stdout; sets a failing exit code if any duplicate was found
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { duplicateInstallCheckBroker } from '../../duplicate-install/check/duplicate-install-check-broker';
import { duplicateInstallReportTransformer } from '../../../transformers/duplicate-install-report/duplicate-install-report-transformer';

export const commandDedupeCheckBroker = async ({
  rootPath,
}: {
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const violations = await duplicateInstallCheckBroker({
    rootPath: filePathContract.parse(rootPath),
  });
  const report = duplicateInstallReportTransformer({ violations });

  process.stdout.write(`${report}\n`);

  if (violations.length > 0) {
    process.exitCode = wardExitCodeStatics.exitCodes.failing;
  }

  return adapterResultContract.parse({ success: true });
};
