/**
 * PURPOSE: Resolves the absolute path to a resolved web-bundle package's built dist/ dir so the
 *   single-port published server can serve the web UI's static files. Takes the package NAME as a
 *   parameter rather than deciding it — webBundlePackageResolveBroker is the caller that decides
 *   which of this server's own dependencies is the frontend bundle; that decision stays separate
 *   from resolving one already-named package's dist path. Returns null when the bundle cannot be
 *   resolved (package or its build absent).
 *
 * USAGE:
 * const distPath = webBundleDistPathBroker({ packageName: PackageNameStub({ value: '@dungeonmaster/web' }) });
 * // FilePath to <...>/@dungeonmaster/web/dist, or null when unavailable
 */
import { existsSync } from '#gateway/node/fs';
import { resolvePackageRoot } from '#gateway/node/module';
import { join } from '#gateway/node/path';
import type { PackageName } from '@dungeonmaster/shared/contracts';


const PACKAGE_JSON_FILENAME = 'package.json';
const DIST_DIRNAME = 'dist';

export const webBundleDistPathBroker = ({
  packageName,
}: {
  packageName: PackageName;
}): string | null => {
  const packageRoot = resolvePackageRoot({ specifier: `${packageName}/${PACKAGE_JSON_FILENAME}` });

  if (packageRoot === null) {
    return null;
  }

  const distPath = join(packageRoot, DIST_DIRNAME);

  if (!existsSync(distPath)) {
    return null;
  }

  return distPath;
};
