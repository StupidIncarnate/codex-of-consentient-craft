/**
 * PURPOSE: Resolves the absolute path to the built @dungeonmaster/web bundle (its dist/ dir) so the
 *   single-port published server can serve the web UI's static files. Returns null when the bundle
 *   cannot be resolved (web package or its build absent).
 *
 * USAGE:
 * const distPath = webBundleDistPathAdapter();
 * // FilePath to <...>/@dungeonmaster/web/dist, or null when unavailable
 */
import { existsSync } from 'fs';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

const PACKAGE_JSON_FILENAME = 'package.json';
const DIST_DIRNAME = 'dist';

export const webBundleDistPathAdapter = (): FilePath | null => {
  try {
    const packageJsonPath = require.resolve('@dungeonmaster/web/package.json');
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
