/**
 * PURPOSE: Install ward package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Adds .ward/ to .gitignore or skips if already present
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
