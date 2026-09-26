/**
 * PURPOSE: CLI entry for `dungeonmaster-ward platform` — delegates straight to the command broker.
 * Takes no flags today; every flag `run` supports (`--only`, file scoping, `--onlyTests`) is
 * meaningless here, since the check always needs the whole repo's import graph.
 *
 * USAGE:
 * await WardPlatformResponder({ args: ['node', 'ward', 'platform'], rootPath: AbsoluteFilePathStub() });
 * // Runs the platform-crossing check over the whole repo and prints its report
 */

import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { commandPlatformCheckBroker } from '../../../brokers/command/platform-check/command-platform-check-broker';

export const WardPlatformResponder = async ({
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  await commandPlatformCheckBroker({ rootPath });
  return adapterResultContract.parse({ success: true });
};
