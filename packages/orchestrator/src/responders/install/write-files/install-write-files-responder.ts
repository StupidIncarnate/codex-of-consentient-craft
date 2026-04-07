/**
 * PURPOSE: Returns install result for the orchestrator package (agent prompts served via MCP get-agent-prompt tool)
 *
 * USAGE:
 * const result = await InstallWriteFilesResponder({ context });
 * // Returns success result — agent prompts are delivered dynamically via the get-agent-prompt MCP tool
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';

const PACKAGE_NAME = '@dungeonmaster/orchestrator';

export const InstallWriteFilesResponder = ({
  context: _context,
}: {
  context: InstallContext;
}): InstallResult => ({
  packageName: packageNameContract.parse(PACKAGE_NAME),
  success: true,
  action: 'created',
  message: installMessageContract.parse('Agent prompts served via MCP get-agent-prompt tool'),
});
