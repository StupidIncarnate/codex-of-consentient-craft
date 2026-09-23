/**
 * PURPOSE: Resolves the absolute path to a resolved web-bundle package's built dist/ dir so the
 *   single-port published server can serve the web UI's static files. Takes the package NAME as a
 *   parameter rather than deciding it — webBundlePackageResolveBroker is the caller that decides
 *   which of this server's own dependencies is the frontend bundle, since an adapter may not import
 *   a broker. Returns null when the bundle cannot be resolved (package or its build absent).
 *
 * USAGE:
 * const distPath = webBundleDistPathAdapter({ packageName: PackageNameStub({ value: '@dungeonmaster/web' }) });
 * // FilePath to <...>/@dungeonmaster/web/dist, or null when unavailable
 */
import { existsSync } from 'fs';
import type { PackageName } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const PACKAGE_JSON_FILENAME = 'package.json';
const DIST_DIRNAME = 'dist';

export const webBundleDistPathAdapter = ({
  packageName,
}: {
  packageName: PackageName;
}): FilePath | null => {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`);
    // Swap the trailing `package.json` filename for the sibling `dist` dir. A self-contained string
    // op (no path.join/dirname) keeps this resolution independent of the shared path adapters.
    const distPath = `${packageJsonPath.slice(0, -PACKAGE_JSON_FILENAME.length)}${DIST_DIRNAME}`;

    if (!existsSync(distPath)) {
      return null;
    }

    return filePathContract.parse(distPath);
  } catch {
    return null;
  }
};
