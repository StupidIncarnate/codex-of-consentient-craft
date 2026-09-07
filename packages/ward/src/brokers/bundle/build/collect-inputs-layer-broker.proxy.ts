import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { bundleInputsTransformer } from '../../../transformers/bundle-inputs/bundle-inputs-transformer';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { resolveWorkspaceRootLayerBrokerProxy } from './resolve-workspace-root-layer-broker.proxy';

// The two patterns a staged package answers files for. Every other pattern is staged EMPTY rather
// than left unstaged, so a package the closure walk was never meant to reach throws on its first
// glob instead of quietly contributing nothing.
const SOURCE_PATTERN = 'src/**';
const SHELL_PATTERN = 'index.html';

export const collectInputsLayerBrokerProxy = (): {
  setupWorkspaceRoot: (params: { packageDirs: string[]; packageNames: string[] }) => void;
  setupNoWorkspaceAbove: (params: { packageRoot: AbsoluteFilePath }) => void;
  setupPackage: (params: {
    packageRoot: AbsoluteFilePath;
    name: string;
    dependencies: string[];
    sourceFiles: string[];
    isBundled: boolean;
  }) => void;
  setupUnbundledNeighbour: (params: {
    packageRoot: AbsoluteFilePath;
    name: string;
    dependencies: string[];
  }) => void;
} => {
  const rootProxy = resolveWorkspaceRootLayerBrokerProxy();
  const discoverProxy = workspaceDiscoverBrokerProxy();
  const readProxy = fsReadFileAdapterProxy();
  const globProxy = fsGlobSyncAdapterProxy();

  // workspaceDiscoverBrokerProxy resolves everything against this root and this base directory —
  // it is the only workspace layout its own setup describes, so the fixtures here share it.
  const REPO_ROOT = absoluteFilePathContract.parse('/project');

  const stageManifest = ({
    packageRoot,
    name,
    dependencies,
  }: {
    packageRoot: AbsoluteFilePath;
    name: string;
    dependencies: string[];
  }): void => {
    // Overrides the name-only manifest setupWorkspaceRoot staged for this package: the closure walk
    // needs the `dependencies` map, and the build-script check needs `scripts`.
    readProxy.returns({
      filePath: filePathContract.parse(`${String(packageRoot)}/package.json`),
      content: JSON.stringify({
        name,
        scripts: { build: 'vite build' },
        dependencies: Object.fromEntries(dependencies.map((dep) => [dep, '*'])),
        devDependencies: { '@dm/testing': '*' },
      }),
    });
  };

  return {
    setupWorkspaceRoot: ({
      packageDirs,
      packageNames,
    }: {
      packageDirs: string[];
      packageNames: string[];
    }): void => {
      discoverProxy.setupMultiPackage({
        patterns: ['packages/*'],
        dirs: packageDirs,
        packageNames,
      });
      // The walk up from a package passes through the directory the workspaces live in, which has
      // no manifest of its own.
      rootProxy.hasNoManifest({
        dirPath: absoluteFilePathContract.parse(`${String(REPO_ROOT)}/packages`),
      });
    },

    setupNoWorkspaceAbove: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const segments = String(packageRoot)
        .split('/')
        .filter((segment) => segment.length > 0);

      for (const [index] of segments.slice(0, -1).entries()) {
        rootProxy.hasNoManifest({
          dirPath: absoluteFilePathContract.parse(`/${segments.slice(0, index + 1).join('/')}`),
        });
      }
    },

    setupPackage: ({
      packageRoot,
      name,
      dependencies,
      sourceFiles,
      isBundled,
    }: {
      packageRoot: AbsoluteFilePath;
      name: string;
      dependencies: string[];
      sourceFiles: string[];
      isBundled: boolean;
    }): void => {
      stageManifest({ packageRoot, name, dependencies });

      for (const pattern of bundleInputsTransformer({ isBundledPackage: isBundled })) {
        const sourceMatches = String(pattern) === SOURCE_PATTERN ? sourceFiles : [];
        const shellMatches = String(pattern) === SHELL_PATTERN ? [SHELL_PATTERN] : [];

        globProxy.returnsForPatternInDir({
          pattern: String(pattern),
          cwd: packageRoot,
          files: [...sourceMatches, ...shellMatches],
        });
      }
    },

    setupUnbundledNeighbour: ({
      packageRoot,
      name,
      dependencies,
    }: {
      packageRoot: AbsoluteFilePath;
      name: string;
      dependencies: string[];
    }): void => {
      stageManifest({ packageRoot, name, dependencies });
    },
  };
};
