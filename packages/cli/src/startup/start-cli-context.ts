/**
 * PURPOSE: Builds the install context for one `dungeonmaster` invocation. The target project root
 * is the directory the user ran the command from, read here in the startup layer so the bin entry
 * and everything below it take the location as a value.
 *
 * USAGE:
 * const context = StartCliContext({ dungeonmasterRoot: '/usr/lib/node_modules/dungeonmaster' });
 * // Returns { dungeonmasterRoot, targetProjectRoot: <the user's cwd> }
 */

import { installContextContract } from '@dungeonmaster/shared/contracts';
import type { InstallContext } from '@dungeonmaster/shared/contracts';
import { cwd } from '#gateway/node/process';

export const StartCliContext = ({
  dungeonmasterRoot,
}: {
  dungeonmasterRoot: string;
}): InstallContext => installContextContract.parse({ dungeonmasterRoot, targetProjectRoot: cwd() });
