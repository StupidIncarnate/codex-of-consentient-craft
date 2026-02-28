/**
 * PURPOSE: Install eslint-plugin by delegating to the install flow
 *
 * USAGE:
 * const result = StartInstall({ context });
 * // Creates eslint.config.js with dungeonmaster config or skips if already exists
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = ({ context }: { context: InstallContext }): InstallResult =>
  InstallFlow({ context });
