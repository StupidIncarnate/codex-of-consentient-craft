/**
 * PURPOSE: The disk-facing counterpart to isPackageE2eEligibleGuard — reads a package's own
 * src/adapters layout and package.json straight off disk rather than through
 * architecturePackageTypeDetectBroker's single winning PackageType label, so a package whose
 * frontend signals are shadowed by a higher-priority rule (hono/express, MCP) still reports
 * eligible here. Reach for architecturePackageTypeDetectBroker instead when the caller needs the
 * full classification, not just the e2e answer.
 *
 * USAGE:
 * const eligible = await architecturePackageE2eEligibleDetectBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/web'),
 * });
 * // Returns true when the package's own widgets+react (or ink) signals qualify it for
 * // Playwright e2e coverage
 *
 * WHEN-TO-USE: Wherever e2e ownership must be decided from a package's own disk layout — ward's
 * e2e check runner, the CLI's Playwright installer
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { isPackageE2eEligibleGuard } from '../../../guards/is-package-e2e-eligible/is-package-e2e-eligible-guard';
import { readFileOptionalLayerBroker } from './read-file-optional-layer-broker';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const architecturePackageE2eEligibleDetectBroker = async ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): Promise<boolean> => {
  const packageJsonPath = absoluteFilePathContract.parse(`${packageRoot}/package.json`);
  const packageJsonRaw = readFileOptionalLayerBroker({ filePath: packageJsonPath });
  const packageJson = packageJsonContract.parse(
    packageJsonRaw === undefined ? {} : (JSON.parse(String(packageJsonRaw)) as unknown),
  );

  const srcPath = absoluteFilePathContract.parse(`${packageRoot}/src`);
  const srcEntries = safeReaddirLayerBroker({ dirPath: srcPath });
  const srcDirNames = srcEntries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  const adaptersPath = absoluteFilePathContract.parse(`${packageRoot}/src/adapters`);
  const adapterEntries = safeReaddirLayerBroker({ dirPath: adaptersPath });
  const adapterDirNames = adapterEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return Promise.resolve(isPackageE2eEligibleGuard({ adapterDirNames, srcDirNames, packageJson }));
};
