/**
 * PURPOSE: Orchestrates the orchestrator package installation — writes the dumpster slash command
 * files into `<targetProjectRoot>/.claude/commands/` and returns the install result.
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Returns install result for the orchestrator package after the slash commands are written
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallCommandsCreateResponder } from '../../responders/install/commands-create/install-commands-create-responder';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallCommandsCreateResponder({ context });
