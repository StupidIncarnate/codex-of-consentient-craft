/**
 * PURPOSE: Install hooks package by creating/updating .claude/settings.json in target project
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .claude/settings.json with hooks or merges into existing, skips if already configured
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
