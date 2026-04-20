/**
 * PURPOSE: Parses optional runId from CLI args and delegates to the command list broker
 *
 * USAGE:
 * await WardListResponder({ args: ['node', 'ward', 'list'], rootPath: AbsoluteFilePathStub() });
 * // Loads and displays errors-by-file list from most recent or specified run
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import { commandListBroker } from '../../../brokers/command/list/command-list-broker';

const FIRST_POSITIONAL_INDEX = 3;

export const WardListResponder = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const runIdArg = args[FIRST_POSITIONAL_INDEX];
  const runId = runIdArg ? runIdContract.parse(runIdArg) : undefined;
  const loadArgs = runId ? { rootPath, runId } : { rootPath };
  await commandListBroker(loadArgs);
  return adapterResultContract.parse({ success: true });
};
