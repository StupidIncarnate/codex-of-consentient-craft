/**
 * PURPOSE: Runs `ward scan <rule>`: parses the rule and optional paths, prints the scan report as
 * JSON on stdout, and sets a failing exit code only when the scan itself could not run. A scan is
 * data, not a gate, so finding violations exits 0.
 *
 * USAGE:
 * await WardScanResponder({ args: ['node', 'ward', 'scan', '@dungeonmaster/ban-primitives'], rootPath: AbsoluteFilePathStub() });
 * // Writes { rule, packages: [{ name, violations, batches }] } to stdout
 */

import { setExitCode, stderr, stdout } from '#gateway/node/process';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { cliArgContract } from '../../../contracts/cli-arg/cli-arg-contract';
import { scanArgsParseTransformer } from '../../../transformers/scan-args-parse/scan-args-parse-transformer';
import { scanRunBroker } from '../../../brokers/scan/run/scan-run-broker';

const FIRST_POSITIONAL_INDEX = 3;
const JSON_INDENT = 2;

export const WardScanResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });

  try {
    const config = scanArgsParseTransformer({
      args: args.slice(FIRST_POSITIONAL_INDEX).map((arg) => cliArgContract.parse(arg)),
    });
    const report = await scanRunBroker({ config, rootPath });
    stdout.write(`${JSON.stringify(report, null, JSON_INDENT)}\n`);
  } catch (error: unknown) {
    stderr.write(`Scan failed: ${error instanceof Error ? error.message : String(error)}\n`);
    setExitCode(wardExitCodeStatics.exitCodes.failing);
  }

  return result;
};
