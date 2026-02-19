/**
 * PURPOSE: Executes a full ward run and prints a summary to stdout, exiting with appropriate code
 *
 * USAGE:
 * await commandRunBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Runs all checks, prints summary, exits 0 on pass or 1 on failure
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { orchestrateRunAllBroker } from '../../orchestrate/run-all/orchestrate-run-all-broker';
import { resultToSummaryTransformer } from '../../../transformers/result-to-summary/result-to-summary-transformer';

export const commandRunBroker = async ({
  config,
  rootPath,
  cwd,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
  cwd: AbsoluteFilePath;
}): Promise<void> => {
  const wardResult = await orchestrateRunAllBroker({
    config,
    rootPath,
    onProgress: ({ checkType, packageName, completed, total }) => {
      process.stderr.write(
        `\r\x1b[KProcessing... ${packageName} (${checkType}) [${String(completed)}/${String(total)}]`,
      );
    },
  });
  process.stderr.write('\r\x1b[K');
  const summary = resultToSummaryTransformer({ wardResult, cwd });

  process.stdout.write(`${summary}\n`);

  const hasFailing = wardResult.checks.some((check) => check.status === 'fail');

  if (hasFailing) {
    process.stdout.write(`\nFull error details: npx dungeonmaster-ward list ${wardResult.runId}\n`);
    process.exit(1);
  }
};
