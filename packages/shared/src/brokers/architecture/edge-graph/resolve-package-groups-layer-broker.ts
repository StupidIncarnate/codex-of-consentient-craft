/**
 * PURPOSE: Buckets every package under a project root into the http-backend and frontend sets
 * httpEdgesLayerBroker scans, off each package's own flow/widgets/dependency signals — never
 * off a package's name. A package can land in neither set (most packages) or, since the checks
 * are independent, in both.
 *
 * USAGE:
 * const { httpBackendRoots, frontendRoots } = resolvePackageGroupsLayerBroker({
 *   projectRoot: '/repo',
 * });
 * // Returns AbsoluteFilePath[] for each set — empty when packages/ is missing (single-root repo)
 *
 * WHEN-TO-USE: Inside httpEdgesLayerBroker, once per scan, before walking flows/ and brokers/
 */

import { resolvePackageGroupsLayerResultContract } from '../../../contracts/resolve-package-groups-layer-result/resolve-package-groups-layer-result-contract';
import type { ResolvePackageGroupsLayerResult } from '../../../contracts/resolve-package-groups-layer-result/resolve-package-groups-layer-result-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { hasHonoOrExpressDependencyGuard } from '../../../guards/has-hono-or-express-dependency/has-hono-or-express-dependency-guard';
import { flowCreatesHonoOrExpressAppGuard } from '../../../guards/flow-creates-hono-or-express-app/flow-creates-hono-or-express-app-guard';
import { matchesFlowFileNameGuard } from '../../../guards/matches-flow-file-name/matches-flow-file-name-guard';
import { listTsFilesLayerBroker } from './list-ts-files-layer-broker';
import { isPackageE2eEligibleGuard } from '../../../guards/is-package-e2e-eligible/is-package-e2e-eligible-guard';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { readFileLayerBroker } from './read-file-layer-broker';

export const resolvePackageGroupsLayerBroker = ({
  projectRoot,
}: {
  projectRoot: string;
}): ResolvePackageGroupsLayerResult => {
  const packagesDir = `${projectRoot}/${projectMapStatics.packagesDirName}`;
  const packageEntries = safeReaddirLayerBroker({ dirPath: packagesDir }).filter(
    (entry) => entry.kind === 'directory',
  );
  const candidateRoots =
    packageEntries.length > 0
      ? packageEntries.map(
          (entry) => `${projectRoot}/${projectMapStatics.packagesDirName}/${entry.name}`,
        )
      : [projectRoot];

  const httpBackendRoots: string[] = [];
  const frontendRoots: string[] = [];

  for (const packageRoot of candidateRoots) {
    const srcPath = `${packageRoot}/${projectMapStatics.srcDirName}`;
    const srcDirNames = safeReaddirLayerBroker({ dirPath: srcPath })
      .filter((entry) => entry.kind === 'directory')
      .map((entry) => entry.name);

    const packageJsonPath = `${packageRoot}/${projectMapStatics.packageJsonName}`;
    const packageJsonRaw = readFileLayerBroker({ filePath: packageJsonPath });
    let packageJson = packageJsonContract.parse({});
    if (packageJsonRaw !== undefined) {
      try {
        packageJson = packageJsonContract.parse(JSON.parse(packageJsonRaw) as unknown);
      } catch {
        // Malformed package.json — treat this candidate as carrying no dependency signals
        // rather than crashing the whole scan over one bad file.
      }
    }

    // The flow file that constructs the app is the http-backend signal, same as package-type
    // detection, which also accepts a declared hono/express dependency beside a flows folder.
    if (
      (srcDirNames.includes('flows') && hasHonoOrExpressDependencyGuard({ packageJson })) ||
      listTsFilesLayerBroker({
        dirPath: `${packageRoot}/${projectMapStatics.srcDirName}/flows`,
      }).some(
        (flowPath) =>
          matchesFlowFileNameGuard({ name: flowPath }) &&
          flowCreatesHonoOrExpressAppGuard({
            flowFileContent: readFileLayerBroker({ filePath: flowPath }) ?? '',
          }),
      )
    ) {
      httpBackendRoots.push(packageRoot);
    }

    if (isPackageE2eEligibleGuard({ srcDirNames, packageJson })) {
      frontendRoots.push(packageRoot);
    }
  }

  return resolvePackageGroupsLayerResultContract.parse({ httpBackendRoots, frontendRoots });
};
