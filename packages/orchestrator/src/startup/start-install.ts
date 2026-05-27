/**
 * PURPOSE: Install orchestrator package by delegating to the install flow — writes the
 * `/dumpster-create` and `/dumpster-launch` slash command markdown files into
 * `<targetProjectRoot>/.claude/commands/` so users can launch the Dumpster orchestration loop
 * from their interactive Claude session.
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Returns install result for the orchestrator package after the slash commands are written
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
