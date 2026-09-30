/**
 * PURPOSE: Parses runId and checkType from CLI args and delegates to the command raw broker
 *
 * USAGE:
 * await WardRawResponder({ args: ['node', 'ward', 'raw', '123-abc', 'lint'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays raw tool output for the specified check type in the specified run
 */

import { stderr } from '#gateway/node/process';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { checkTypeContract } from '../../../contracts/check-type/check-type-contract';
import { commandRawBroker } from '../../../brokers/command/raw/command-raw-broker';
import { wardRunResultContract } from '../../../contracts/ward-result/ward-result-contract';

const FIRST_POSITIONAL_INDEX = 3;
const SECOND_POSITIONAL_INDEX = 4;

export const WardRawResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const runIdArg = args[FIRST_POSITIONAL_INDEX];
  const checkTypeArg = args[SECOND_POSITIONAL_INDEX];

  if (!runIdArg || !checkTypeArg) {
    stderr.write('Usage: ward raw <run-id> <check-type>\n');
    return;
  }

  const runId = wardRunResultContract.shape.runId.parse(runIdArg);
  const checkType = checkTypeContract.parse(checkTypeArg);
  await commandRawBroker({ rootPath, runId, checkType });
};
