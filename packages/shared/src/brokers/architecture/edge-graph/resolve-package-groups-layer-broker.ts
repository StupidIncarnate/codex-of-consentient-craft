/**
 * PURPOSE: Buckets every package under a project root into the http-backend and frontend sets
 * httpEdgesLayerBroker scans, off each package's own adapter/widgets/dependency signals — never
 * off a package's name. A package can land in neither set (most packages) or, since the checks
 * are independent, in both.
 *
 * USAGE:
 * const { httpBackendRoots, frontendRoots } = resolvePackageGroupsLayerBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns AbsoluteFilePath[] for each set — empty when packages/ is missing (single-root repo)
 *
 * WHEN-TO-USE: Inside httpEdgesLayerBroker, once per scan, before walking flows/ and brokers/
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { hasHonoOrExpressAdapterGuard } from '../../../guards/has-hono-or-express-adapter/has-hono-or-express-adapter-guard';
import { isPackageE2eEligibleGuard } from '../../../guards/is-package-e2e-eligible/is-package-e2e-eligible-guard';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

export const resolvePackageGroupsLayerBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): {
  httpBackendRoots: AbsoluteFilePath[];
  frontendRoots: AbsoluteFilePath[];
} => {
  const packagesDir = absoluteFilePathContract.parse(
    `${projectRoot}/${projectMapStatics.packagesDirName}`,
  );
  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir }).filter((entry) =>
    entry.isDirectory(),
  );
  const candidateRoots =
    packageEntries.length > 0
      ? packageEntries.map((entry) =>
          absoluteFilePathContract.parse(
            `${projectRoot}/${projectMapStatics.packagesDirName}/${entry.name}`,
          ),
        )
      : [projectRoot];

  const httpBackendRoots: AbsoluteFilePath[] = [];
  const frontendRoots: AbsoluteFilePath[] = [];

  for (const packageRoot of candidateRoots) {
    const srcPath = absoluteFilePathContract.parse(
      `${packageRoot}/${projectMapStatics.srcDirName}`,
    );
    const srcDirNames = safeReaddirLayerBroker({ dirPath: srcPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    const adaptersPath = absoluteFilePathContract.parse(
      `${packageRoot}/${projectMapStatics.srcDirName}/adapters`,
    );
    const adapterDirNames = safeReaddirLayerBroker({ dirPath: adaptersPath })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    if (hasHonoOrExpressAdapterGuard({ adapterDirNames })) {
      httpBackendRoots.push(packageRoot);
    }

    const packageJsonPath = absoluteFilePathContract.parse(
      `${packageRoot}/${projectMapStatics.packageJsonName}`,
    );
    const packageJsonRaw = readFileLayerBroker({ filePath: packageJsonPath });
    let packageJson = packageJsonContract.parse({});
    if (packageJsonRaw !== undefined) {
      try {
        packageJson = packageJsonContract.parse(JSON.parse(String(packageJsonRaw)) as unknown);
      } catch {
        // Malformed package.json — treat this candidate as carrying no dependency signals
        // rather than crashing the whole scan over one bad file.
      }
    }

    if (isPackageE2eEligibleGuard({ adapterDirNames, srcDirNames, packageJson })) {
      frontendRoots.push(packageRoot);
    }
  }

  return { httpBackendRoots, frontendRoots };
};
