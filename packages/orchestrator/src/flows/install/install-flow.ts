/**
 * PURPOSE: Orchestrates the orchestrator package installation — writes the dumpster slash command
 * files and scaffolds the worktrees directory the quest git lifecycle checks its worktrees out
 * into. The two steps are reported as one InstallResult because `dungeonmaster init` surfaces one
 * line per package, so a skipped scaffold has to stay visible alongside a written command file.
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
import { InstallWorktreesScaffoldResponder } from '../../responders/install/worktrees-scaffold/install-worktrees-scaffold-responder';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const commandsResult = await InstallCommandsCreateResponder({ context });
  const scaffoldResult = await InstallWorktreesScaffoldResponder({ context });

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
