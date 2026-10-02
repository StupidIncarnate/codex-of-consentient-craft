/**
 * PURPOSE: Resolves one of our modules for work done in `repoRoot` — the run root's own
 * `node_modules` first (Node's own walk), then this process's own install only when the run root
 * has none (a global-install-only consumer). Reach for this over a bare `require.resolve`, which
 * answers "where is THIS process installed" — the main checkout inside the server, whatever
 * checkout the work is actually for. The result names which install answered.
 *
 * USAGE:
 * moduleResolveBroker({ specifier: '@dungeonmaster/cli/package.json', repoRoot: '/repo/worktrees/quest-a' });
 * // Returns { path: '/repo/worktrees/quest-a/node_modules/@dungeonmaster/cli/package.json', resolvedFrom: 'run-root' }
 */

import { resolveModuleIfExists } from '#gateway/node/module';

import { moduleResolutionContract } from '../../../contracts/module-resolution/module-resolution-contract';
import type { ModuleResolution } from '../../../contracts/module-resolution/module-resolution-contract';

export const moduleResolveBroker = ({
  specifier,
  repoRoot,
}: {
  specifier: string;
  repoRoot: string;
}): ModuleResolution => {
  const runRootPath = resolveModuleIfExists({ specifier, fromDir: repoRoot });

  if (runRootPath !== null) {
    return moduleResolutionContract.parse({ path: runRootPath, resolvedFrom: 'run-root' });
  }

  const ownInstallPath = resolveModuleIfExists({ specifier });

  if (ownInstallPath !== null) {
    return moduleResolutionContract.parse({ path: ownInstallPath, resolvedFrom: 'own-install' });
  }

  throw new Error(
    `moduleResolveBroker: cannot resolve "${specifier}" from run root ${repoRoot} or from this process's own install`,
  );
};
