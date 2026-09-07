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

import {
  absoluteFilePathContract,
  filePathContract,
  packageJsonContract as workspaceNameContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import {
  dependencyGraphAdjacencyBuildTransformer,
  dependencyGraphClosureWalkTransformer,
} from '@dungeonmaster/shared/transformers';

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { fsGlobSyncAdapter } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
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
  packageRoot: AbsoluteFilePath;
}): Promise<{ repoRoot: AbsoluteFilePath; relativePaths: GitRelativePath[] }> => {
  const workspaceRoot = await resolveWorkspaceRootLayerBroker({ startPath: packageRoot });
  const repoRoot = workspaceRoot ?? packageRoot;

  const folders = (await workspaceDiscoverBroker({ rootPath: repoRoot })) ?? [];
  const folderPaths = folders.map((folder) => absoluteFilePathContract.parse(String(folder.path)));

  // A single-package repo declares no workspaces, and a package can also be excluded from the
  // patterns that DO exist. Either way its own sources are what the bundle is built from, so the
  // bundled package is in the list whether or not the workspace walk reported it.
  const packagePaths = folderPaths.some((path) => String(path) === String(packageRoot))
    ? folderPaths
    : [...folderPaths, packageRoot];

  const manifests = await Promise.all(
    packagePaths.map(async (packagePath) => {
      const raw = await fsReadFileAdapter({
        filePath: filePathContract.parse(`${String(packagePath)}/package.json`),
      }).catch(() => null);

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

      const dirName = String(packagePath).slice(String(packagePath).lastIndexOf('/') + 1);

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
    (manifest) => String(manifest.path) === String(packageRoot),
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
      String(manifest.path) === String(packageRoot) ||
      closure.some((name) => String(name) === String(manifest.name)),
  );

  const relativePaths: GitRelativePath[] = [];
  const seen = new Set<GitRelativePath>();

  // The lockfile: a dependency version bump edits no file inside any workspace package, and the
  // bundle it produces is a different bundle.
  const lockfile = gitRelativePathContract.parse(bundleStatics.lockfileName);
  seen.add(lockfile);
  relativePaths.push(lockfile);

  for (const folder of closureFolders) {
    const isBundledPackage = String(folder.path) === String(packageRoot);
    const { discoveredFiles } = fsGlobSyncAdapter({
      patterns: bundleInputsTransformer({ isBundledPackage }),
      cwd: folder.path,
    });

    const prefix =
      String(folder.path) === String(repoRoot)
        ? ''
        : `${String(folder.path).slice(String(repoRoot).length + 1)}/`;

    for (const file of discoveredFiles) {
      const repoRelative = gitRelativePathContract.parse(`${prefix}${String(file)}`);
      if (!seen.has(repoRelative)) {
        seen.add(repoRelative);
        relativePaths.push(repoRelative);
      }
    }
  }

  return { repoRoot, relativePaths };
};
