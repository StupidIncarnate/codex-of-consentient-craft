/**
 * PURPOSE: Generates a package summary snippet by extracting package headers from the project map
 *
 * USAGE:
 * const content = await HookSessionSnippetPackagesResponder();
 * // Returns ContentText with markdown list of package names and descriptions
 *
 * WHEN-TO-USE: When the session-snippet hook needs dynamic packages content at runtime
 */

import { architectureProjectMapBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import { fsReaddirWithTypesAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, ContentText, PackageName } from '@dungeonmaster/shared/contracts';
import { extractPackageHeadersTransformer } from '../../../transformers/extract-package-headers/extract-package-headers-transformer';

const SINGLE_ROOT_FALLBACK_PACKAGE_NAME = 'root';

export const HookSessionSnippetPackagesResponder = async ({
  projectRoot = absoluteFilePathContract.parse(processCwdAdapter()),
}: {
  projectRoot?: AbsoluteFilePath;
} = {}): Promise<ContentText> => {
  const projectRootPath = absoluteFilePathContract.parse(String(projectRoot));
  const packagesDir = absoluteFilePathContract.parse(`${String(projectRootPath)}/packages`);

  let packages: PackageName[] = [packageNameContract.parse(SINGLE_ROOT_FALLBACK_PACKAGE_NAME)];
  try {
    const dirs = fsReaddirWithTypesAdapter({ dirPath: packagesDir }).filter((entry) =>
      entry.isDirectory(),
    );
    if (dirs.length > 0) {
      packages = dirs.map((entry) => packageNameContract.parse(entry.name));
    }
  } catch {
    // Single-root mode (no packages/ directory): keep the fallback initialization above.
  }

  const fullMap = await architectureProjectMapBroker({
    projectRoot: projectRootPath,
    packages,
  });

  return extractPackageHeadersTransformer({ projectMap: fullMap });
};
