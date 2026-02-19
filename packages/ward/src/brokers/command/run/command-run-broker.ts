/**
 * PURPOSE: Executes a full ward run and prints a summary to stdout, exiting with appropriate code
 *
 * USAGE:
 * await commandRunBroker({ config: WardConfigStub(), rootPath: AbsoluteFilePathStub() });
 * // Runs all checks, prints summary, exits 0 on pass or 1 on failure
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardConfig } from '../../../contracts/ward-config/ward-config-contract';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { commandRunLayerFolderBroker } from './command-run-layer-folder-broker';
import { commandRunLayerSingleBroker } from './command-run-layer-single-broker';
import { commandRunLayerMultiBroker } from './command-run-layer-multi-broker';
import { resultToSummaryTransformer } from '../../../transformers/result-to-summary/result-to-summary-transformer';

export const commandRunBroker = async ({
  config,
  rootPath,
}: {
  config: WardConfig;
  rootPath: AbsoluteFilePath;
}): Promise<void> => {
  const workspaces = await workspaceDiscoverBroker({ rootPath });

  const wardResult =
    workspaces === null
      ? await (async () => {
          const projectFolder = await commandRunLayerFolderBroker({ rootPath });
          return commandRunLayerSingleBroker({ config, projectFolder, rootPath });
        })()
      : await commandRunLayerMultiBroker({ config, projectFolders: workspaces, rootPath });

  process.stderr.write('\r\x1b[K');
  const summary = resultToSummaryTransformer({ wardResult, cwd: rootPath });

  process.stdout.write(`${summary}\n`);

  const hasFailing = wardResult.checks.some((check) => check.status === 'fail');

  if (hasFailing) {
    process.stdout.write(`\nFull error details: npx dungeonmaster-ward list ${wardResult.runId}\n`);
    process.exit(1);
  }
};
