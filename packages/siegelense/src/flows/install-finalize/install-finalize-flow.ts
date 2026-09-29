/**
 * PURPOSE: Entry point for siegelense's after-all-installs step — the npm install / npm run build
 * a fresh packages/hydration-recipes/ scaffold still needs, run once every package's StartInstall
 * has actually finished (DEF-99) rather than mid-sequence, racing another package's own
 * StartInstall. `start-install.ts`'s StartInstallFinalize is the only caller: the CLI orchestration
 * layer discovers it as an OPTIONAL second export on the same module StartInstall lives on, and
 * calls it, once, after its main install pass.
 *
 * USAGE:
 * const result = await InstallFinalizeFlow({ context });
 * // Returns a no-op success when nothing was scaffolded this run; otherwise the finalize result
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { InstallRecipesFinalizeResponder } from '../../responders/install/recipes-finalize/install-recipes-finalize-responder';

export const InstallFinalizeFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => InstallRecipesFinalizeResponder({ context });
