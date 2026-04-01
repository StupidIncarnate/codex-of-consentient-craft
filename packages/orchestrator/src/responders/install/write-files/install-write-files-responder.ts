/**
 * PURPOSE: Returns install result for the orchestrator package (file writing moved to just-in-time agent spawn)
 *
 * USAGE:
 * const result = await InstallWriteFilesResponder({ context });
 * // Returns success result — agent prompt files are now written just-in-time before spawn, not at install time
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
  message: installMessageContract.parse(
    'Agent prompt files are written just-in-time before agent spawn',
  ),
});
