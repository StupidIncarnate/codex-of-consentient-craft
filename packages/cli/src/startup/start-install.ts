/**
 * PURPOSE: Install CLI package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Adds devDependencies to package.json or skips if already present
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({ context }: { context: InstallContext }): Promise<InstallResult> =>
  InstallFlow({ context });
