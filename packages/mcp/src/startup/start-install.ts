/**
 * PURPOSE: Install MCP package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .mcp.json with dungeonmaster config, adds MCP permissions to .claude/settings.json
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
