/**
 * PURPOSE: Parses runId and filePath from CLI args and delegates to the command detail broker
 *
 * USAGE:
 * await WardDetailResponder({ args: ['node', 'ward', 'detail', '123-abc', 'src/index.ts'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays detailed errors for the specified file in the specified run
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import { errorEntryContract } from '../../../contracts/error-entry/error-entry-contract';
import { commandDetailBroker } from '../../../brokers/command/detail/command-detail-broker';

const FIRST_POSITIONAL_INDEX = 3;
const SECOND_POSITIONAL_INDEX = 4;

export const WardDetailResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const runIdArg = args[FIRST_POSITIONAL_INDEX];
  const filePathArg = args[SECOND_POSITIONAL_INDEX];

  if (!runIdArg || !filePathArg) {
    process.stderr.write('Usage: ward detail <run-id> <file-path>\n');
    return;
  }

  const runId = runIdContract.parse(runIdArg);
  const filePath = errorEntryContract.shape.filePath.parse(filePathArg);
  await commandDetailBroker({ rootPath, runId, filePath });
};
