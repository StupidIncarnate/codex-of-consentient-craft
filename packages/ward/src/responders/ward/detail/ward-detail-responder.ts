/**
 * PURPOSE: Parses runId, filePath, and --json flag from CLI args and delegates to the command detail broker
 *
 * USAGE:
 * await WardDetailResponder({ args: ['node', 'ward', 'detail', '123-abc', '--json'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays detailed errors in JSON format
 */

import { stderr } from '#gateway/node/process';

import { errorEntryContract } from '../../../contracts/error-entry/error-entry-contract';
import { commandDetailBroker } from '../../../brokers/command/detail/command-detail-broker';
import { wardRunResultContract } from '../../../contracts/ward-run-result/ward-run-result-contract';

const FIRST_POSITIONAL_INDEX = 3;
const JSON_FLAG = '--json';

export const WardDetailResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: string;
}): Promise<void> => {
  const positionalArgs = args.slice(FIRST_POSITIONAL_INDEX).filter((arg) => arg !== JSON_FLAG);
  const json = args.includes(JSON_FLAG);

  const [runIdArg, filePathArg] = positionalArgs;

  if (!runIdArg) {
    stderr.write('Usage: ward detail <run-id> [file-path] [--json]\n');
    return;
  }

  const runId = wardRunResultContract.shape.runId.parse(runIdArg);

  if (filePathArg) {
    const filePath = errorEntryContract.shape.filePath.parse(filePathArg);
    await commandDetailBroker({ rootPath, runId, filePath, json });
    return;
  }

  await commandDetailBroker({ rootPath, runId, json });
};
