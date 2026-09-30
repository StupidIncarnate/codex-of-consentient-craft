/**
 * PURPOSE: Gathers every file whose contents may change what a package's bundle looks like, as
 * paths relative to the workspace root. This is the half of the bundle cache that decides
 * CORRECTNESS — a file left out of this list is a source edit the hash cannot see, so ward serves
 * a stale UI to a browser walk and the specs grade code nobody is running.
 *
 * The walk follows `dependencies` and nothing else. `devDependencies` drags the test harness into
 * the bundled package's closure, so every edit to a proxy or a stub mints a new hash and pays for
 * a rebuild that changes not one byte of the output.
 *
 * USAGE:
 * await collectInputsLayerBroker({ packageRoot: AbsoluteFilePathStub({ value: '/repo/packages/web' }) });
 * // Returns the workspace root plus the workspace-relative path of every input file
 */

import { collectInputsLayerResultContract } from '../../../contracts/collect-inputs-layer-result/collect-inputs-layer-result-contract';
import type { CollectInputsLayerResult } from '../../../contracts/collect-inputs-layer-result/collect-inputs-layer-result-contract';
import { readFile } from '#gateway/node/fs__promises';
import { packageJsonContract as workspaceNameContract } from '@dungeonmaster/shared/contracts';
import {
  dependencyGraphAdjacencyBuildTransformer,
  dependencyGraphClosureWalkTransformer,
} from '@dungeonmaster/shared/transformers';

import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { globDiscoverFilesBroker } from '../../glob/discover-files/glob-discover-files-broker';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';
import { bundleInputsTransformer } from '../../../transformers/bundle-inputs/bundle-inputs-transformer';
import { workspaceDiscoverBroker } from '../../workspace/discover/workspace-discover-broker';
import { resolveWorkspaceRootLayerBroker } from './resolve-workspace-root-layer-broker';

// The dependency-graph transformers brand their names through the SHARED package.json contract, so
// every name handed to them is parsed through that one rather than through ward's own copy.
const packageNameContract = workspaceNameContract.shape.name.unwrap();

export const collectInputsLayerBroker = async ({
  packageRoot,
}: {
  packageRoot: string;
}): Promise<CollectInputsLayerResult> => {
  const workspaceRoot = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });
  const repoRoot = workspaceRoot ?? packageRoot;

  const folders = (await workspaceDiscoverBroker({ rootPath: repoRoot })) ?? [];
  const folderPaths = folders.map((folder) => String(folder.path));

  // A single-package repo declares no workspaces, and a package can also be excluded from the
  // patterns that DO exist. Either way its own sources are what the bundle is built from, so the
  // bundled package is in the list whether or not the workspace walk reported it.
  const packagePaths = folderPaths.some((path) => path === packageRoot)
    ? folderPaths
    : [...folderPaths, packageRoot];

  const manifests = await Promise.all(
    packagePaths.map(async (packagePath) => {
      const raw = await readFile(`${packagePath}/package.json`).catch(() => null);

      const parsed =
        raw === null
          ? null
          : ((): ReturnType<typeof packageJsonContract.parse> | null => {
              try {
                return packageJsonContract.parse(JSON.parse(raw));
              } catch {
                // A workspace whose manifest does not parse contributes no edges. Its files are
                // still hashed below if it is the package being bundled.
                return null;
              }
            })();

      const dirName = packagePath.slice(packagePath.lastIndexOf('/') + 1);

      return {
        path: packagePath,
        name: packageNameContract.parse(parsed?.name ?? dirName),
        dependencyNames: Object.keys(parsed?.dependencies ?? {}).map((depName) =>
          packageNameContract.parse(depName),
        ),
      };
    }),
  );

  const bundledManifest = manifests.find(
    (manifest) => manifest.path === packageRoot,
  );

  const adjacency = dependencyGraphAdjacencyBuildTransformer({ packages: manifests });

  const closure =
    bundledManifest === undefined
      ? []
      : dependencyGraphClosureWalkTransformer({ adjacency, roots: [bundledManifest.name] });

  // The bundled package is kept even when the workspace list never named it — a single-package
  // repo has no workspaces at all, and its own sources are still what the bundle is built from.
  const closureFolders = manifests.filter(
    (manifest) =>
      manifest.path === packageRoot ||
      closure.some((name) => String(name) === String(manifest.name)),
  );

  const relativePaths: string[] = [];
  const seen = new Set<string>();

  // The lockfile: a dependency version bump edits no file inside any workspace package, and the
  // bundle it produces is a different bundle.
  const lockfile = bundleStatics.lockfileName;
  seen.add(lockfile);
  relativePaths.push(lockfile);

  for (const folder of closureFolders) {
    const isBundledPackage = folder.path === packageRoot;
    const { discoveredFiles } = globDiscoverFilesBroker({
      patterns: bundleInputsTransformer({ isBundledPackage }),
      cwd: folder.path,
    });

    const prefix =
      folder.path === repoRoot
        ? ''
        : `${folder.path.slice(repoRoot.length + 1)}/`;

    for (const file of discoveredFiles) {
      const repoRelative = `${prefix}${String(file)}`;
      if (!seen.has(repoRelative)) {
        seen.add(repoRelative);
        relativePaths.push(repoRelative);
      }
    }
  }

  return collectInputsLayerResultContract.parse({ repoRoot, relativePaths });
};
