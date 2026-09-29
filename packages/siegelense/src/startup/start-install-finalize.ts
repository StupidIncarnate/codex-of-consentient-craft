/**
 * PURPOSE: Siegelense's "after all installs" entry point (DEF-99) — the CLI's
 * `packageDiscoverBroker` finds this at `dist/startup/start-install-finalize.js`, ALONGSIDE
 * `start-install.js`, and dynamically imports it for its `StartInstallFinalize` export. The CLI
 * orchestration layer calls it once, after every discovered package's `StartInstall` has already
 * finished, to run the `npm install` / `npm run build` a fresh `packages/hydration-recipes/`
 * scaffold still needs — deferred out of `start-install.ts` itself so it never races another
 * package's own `StartInstall` still writing `package.json`. A package with no
 * `start-install-finalize.js` simply has no after-all-installs step; the CLI treats that file's
 * absence as a no-op, not an error.
 *
 * USAGE:
 * const result = await StartInstallFinalize({ context });
 * // Returns a no-op success when nothing was scaffolded this run; otherwise the finalize result
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallFinalizeFlow } from '../flows/install-finalize/install-finalize-flow';

export const StartInstallFinalize = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallFinalizeFlow({ context });
