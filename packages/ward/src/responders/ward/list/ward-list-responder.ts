/**
 * PURPOSE: Parses optional runId from CLI args and delegates to the command list broker
 *
 * USAGE:
 * await WardListResponder({ args: ['node', 'ward', 'list'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays errors-by-file list from most recent or specified run
 */


import { commandListBroker } from '../../../brokers/command/list/command-list-broker';
import { wardRunResultContract } from '../../../contracts/ward-result/ward-result-contract';

const FIRST_POSITIONAL_INDEX = 3;

export const WardListResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: string;
}): Promise<void> => {
  const runIdArg = args[FIRST_POSITIONAL_INDEX];
  const runId = runIdArg ? wardRunResultContract.shape.runId.parse(runIdArg) : undefined;
  const loadArgs = runId ? { rootPath, runId } : { rootPath };
  await commandListBroker(loadArgs);
};
