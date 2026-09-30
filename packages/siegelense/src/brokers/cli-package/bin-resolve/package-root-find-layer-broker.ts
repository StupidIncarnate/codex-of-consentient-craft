/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor holding a `package.json`.
 * cliPackageBinResolveBroker calls this instead of a fixed `dirname(dirname(...))` hop count,
 * which is only correct while `require.resolve('@dungeonmaster/cli')` lands on ONE particular
 * export condition — under `--conditions=source` (ward, jest) it resolves to
 * `src/startup/start-cli.ts`, two directories below the package root; under plain `require` (a
 * real spawned process running compiled output) it resolves to `dist/index.js`, one directory
 * below. Nothing else sits between either resolved path and `@dungeonmaster/cli`'s own root, so
 * the nearest ancestor `package.json` is always that package's own.
 *
 * USAGE:
 * const packageRoot = packageRootFindLayerBroker({ startDir: dirname(resolvedPath) });
 * // Returns the nearest ancestor directory holding a package.json, or null if none is found
 */

import { dirname, join } from '#gateway/node/path';
import { existsSync } from '#gateway/node/fs';

export const packageRootFindLayerBroker = ({
  startDir,
}: {
  startDir: string;
}): string | null => {
  const packageJsonPath = join(startDir, 'package.json');

  if (existsSync(packageJsonPath)) {
    return startDir;
  }

  const parentDir = dirname(startDir);

  if (parentDir === startDir) {
    return null;
  }

  return packageRootFindLayerBroker({ startDir: parentDir });
};
