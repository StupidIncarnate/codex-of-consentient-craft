/**
 * PURPOSE: Install orchestrator package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .claude/commands/ with quest.md and quest:start.md, and .claude/agents/ with agent files
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
