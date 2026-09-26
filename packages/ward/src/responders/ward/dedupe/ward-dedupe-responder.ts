/**
 * PURPOSE: CLI entry for `dungeonmaster-ward dedupe` — delegates straight to the command broker.
 * Takes no flags today; every flag `run` supports (`--only`, file scoping, `--onlyTests`) is
 * meaningless here, since the check always needs the whole repo's workspace layout and node_modules.
 *
 * USAGE:
 * await WardDedupeResponder({ args: ['node', 'ward', 'dedupe'], rootPath: AbsoluteFilePathStub() });
 * // Runs the duplicate-install check over the whole repo and prints its report
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { commandDedupeCheckBroker } from '../../../brokers/command/dedupe-check/command-dedupe-check-broker';

export const WardDedupeResponder = async ({
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await commandDedupeCheckBroker({ rootPath });
  return adapterResultContract.parse({ success: true });
};
