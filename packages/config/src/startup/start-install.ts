/**
 * PURPOSE: Install config package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Creates .dungeonmaster config file with default settings or skips if already exists
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
