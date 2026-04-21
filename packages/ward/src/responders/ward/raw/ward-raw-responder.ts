/**
 * PURPOSE: Parses runId and checkType from CLI args and delegates to the command raw broker
 *
 * USAGE:
 * await WardRawResponder({ args: ['node', 'ward', 'raw', '123-abc', 'lint'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays raw tool output for the specified check type in the specified run
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import { checkTypeContract } from '../../../contracts/check-type/check-type-contract';
import { commandRawBroker } from '../../../brokers/command/raw/command-raw-broker';

const FIRST_POSITIONAL_INDEX = 3;
const SECOND_POSITIONAL_INDEX = 4;

export const WardRawResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const runIdArg = args[FIRST_POSITIONAL_INDEX];
  const checkTypeArg = args[SECOND_POSITIONAL_INDEX];

  if (!runIdArg || !checkTypeArg) {
    process.stderr.write('Usage: ward raw <run-id> <check-type>\n');
    return result;
  }

  const runId = runIdContract.parse(runIdArg);
  const checkType = checkTypeContract.parse(checkTypeArg);
  await commandRawBroker({ rootPath, runId, checkType });
  return result;
};
