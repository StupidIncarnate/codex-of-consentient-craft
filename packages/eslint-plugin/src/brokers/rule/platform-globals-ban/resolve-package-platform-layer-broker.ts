/**
 * PURPOSE: Answers "browser or node?" for the package a linted file lives in, using the same
 * widgets+react / widgets+ink signals packageBrowserTypeTransformer already encodes for ward's e2e
 * detection, so platform-globals-ban never invents a second definition of "browser package". A
 * package packageBrowserTypeTransformer cannot place (no widgets folder — a library package such as
 * @dungeonmaster/shared) falls back to 'node', the brief's documented default for that case.
 * Cached per package root in a module-level Map: a single ward run visits every identifier in every
 * file of a package, and re-reading package.json and re-walking the directory tree per identifier
 * would multiply one directory read into thousands.
 *
 * USAGE:
 * resolvePackagePlatformLayerBroker({ filename: '/repo/packages/web/src/widgets/x.tsx' });
 * // Returns 'browser'
 * resolvePackagePlatformLayerBroker({ filename: '/repo/packages/hooks/src/startup/y.ts' });
 * // Returns 'node'
 */
import {
  filePathContract,
  packageJsonContract,
  type FilePath,
} from '@dungeonmaster/shared/contracts';
import { packageBrowserTypeTransformer } from '@dungeonmaster/shared/transformers';
import { existsSync } from '#gateway/node/fs';
import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import { findAncestorDirectoryLayerBroker } from './find-ancestor-directory-layer-broker';

type GatewayPlatform = 'node' | 'browser';

const packagePlatformCache = new Map<FilePath, GatewayPlatform>();

export const resolvePackagePlatformLayerBroker = ({
  filename,
}: {
  filename: string;
}): GatewayPlatform => {
  const startDir = pathDirnameAdapter({ filePath: filePathContract.parse(filename) });
  const packageRoot = findAncestorDirectoryLayerBroker({
    startDir,
    markerFileName: 'package.json',
  });

  if (packageRoot === undefined) {
    return 'node';
  }

  const cached = packagePlatformCache.get(packageRoot);
  if (cached !== undefined) {
    return cached;
  }

  const packageJsonRaw = fsReadFileSyncAdapter({
    filePath: pathJoinAdapter({ paths: [packageRoot, 'package.json'] }),
  });
  const packageJson = packageJsonContract.parse(JSON.parse(packageJsonRaw));

  const srcDirNames = existsSync(pathJoinAdapter({ paths: [packageRoot, 'src', 'widgets'] }))
    ? ['widgets']
    : [];
  const adapterDirNames = existsSync(
    pathJoinAdapter({ paths: [packageRoot, 'src', 'adapters', 'ink'] }),
  )
    ? ['ink']
    : [];

  const detectedType = packageBrowserTypeTransformer({ adapterDirNames, srcDirNames, packageJson });
  const platform: GatewayPlatform = detectedType === undefined ? 'node' : 'browser';

  packagePlatformCache.set(packageRoot, platform);
  return platform;
};
