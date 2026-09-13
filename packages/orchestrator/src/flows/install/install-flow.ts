/**
 * PURPOSE: Orchestrates the orchestrator package installation — writes the dumpster slash command
 * files and scaffolds the repo root the quest lifecycle needs, the worktrees directory it checks
 * quest branches out into included. The two steps are reported as one InstallResult because
 * `dungeonmaster init` surfaces one line per package, so a skipped scaffold has to stay visible
 * alongside a written command file.
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Returns install result for the orchestrator package after commands and scaffold are written
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { InstallCommandsCreateResponder } from '../../responders/install/commands-create/install-commands-create-responder';
import { InstallRepoScaffoldResponder } from '../../responders/install/repo-scaffold/install-repo-scaffold-responder';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const commandsResult = await InstallCommandsCreateResponder({ context });
  const scaffoldResult = await InstallRepoScaffoldResponder({ context });

  const created = commandsResult.action === 'created' || scaffoldResult.action === 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: commandsResult.success && scaffoldResult.success,
    action: created ? 'created' : 'skipped',
    message: installMessageContract.parse(
      `${String(commandsResult.message)}; ${String(scaffoldResult.message)}`,
    ),
  };
};
