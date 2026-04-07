/**
 * PURPOSE: Install orchestrator package by delegating to the install flow
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Returns install result — agent prompts are served via MCP get-agent-prompt tool
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = ({ context }: { context: InstallContext }): InstallResult =>
  InstallFlow({ context });
