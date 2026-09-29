/**
 * PURPOSE: Install siegelense package by delegating to the install flow — the entry point the
 * CLI's `packageDiscoverBroker` finds at `dist/startup/start-install.js` and dynamically imports
 * for its `StartInstall` export. `start-siegelense.ts` beside this file is a different entry
 * point entirely (the `siegelense run` command flow), so it is untouched by this one.
 * `start-install-finalize.ts` beside this file is siegelense's OTHER install entry point — the CLI
 * orchestration layer's "after all installs" pass (DEF-99) — kept in its own file because a
 * `startup/` file exports exactly one value named for itself.
 *
 * USAGE:
 * const result = await StartInstall({ context });
 * // Returns install result for siegelense after the link, ignore entries, and empty recipes
 * // package are all in place
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFlow } from '../flows/install/install-flow';

export const StartInstall = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFlow({ context });
