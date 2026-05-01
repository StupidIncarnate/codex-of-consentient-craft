/**
 * PURPOSE: Resolves spawn and fs-write annotations for a hook-handlers bin entry table row
 * by scanning the startup source and, when no annotations are found there, tracing into the
 * imported flow file.
 *
 * USAGE:
 * const { spawnName, fsWritePath } = hookAnnotationsResolveLayerBroker({
 *   startupSource: contentTextContract.parse('spawnSync("npm", ["run", "build"]);'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns { spawnName: ContentText('npm'), fsWritePath: undefined }
 *
 * WHEN-TO-USE: hooks-section-render-layer-broker building per-row spawn/fs-write annotations
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { hookFlowImportExtractTransformer } from '../../../transformers/hook-flow-import-extract/hook-flow-import-extract-transformer';
import { hookSpawnNameExtractTransformer } from '../../../transformers/hook-spawn-name-extract/hook-spawn-name-extract-transformer';
import { hookFsWritePathExtractTransformer } from '../../../transformers/hook-fs-write-path-extract/hook-fs-write-path-extract-transformer';
import { relativeImportResolveTransformer } from '../../../transformers/relative-import-resolve/relative-import-resolve-transformer';
import { readSourceLayerBroker } from './read-source-layer-broker';

export const hookAnnotationsResolveLayerBroker = ({
  startupSource,
  packageRoot,
}: {
  startupSource: ContentText | undefined;
  packageRoot: AbsoluteFilePath;
}): { spawnName: ContentText | undefined; fsWritePath: ContentText | undefined } => {
  if (startupSource === undefined) {
    return { spawnName: undefined, fsWritePath: undefined };
  }

  const spawnName = hookSpawnNameExtractTransformer({ source: startupSource });
  const fsWritePath = hookFsWritePathExtractTransformer({ source: startupSource });

  if (spawnName !== undefined || fsWritePath !== undefined) {
    return { spawnName, fsWritePath };
  }

  const flowImport = hookFlowImportExtractTransformer({ source: startupSource });
  if (flowImport === undefined) {
    return { spawnName: undefined, fsWritePath: undefined };
  }

  const stubStartupFile = absoluteFilePathContract.parse(
    `${String(packageRoot)}/src/startup/start-stub.ts`,
  );
  const flowAbsPath = relativeImportResolveTransformer({
    sourceFile: stubStartupFile,
    importPath: flowImport,
  });
  if (flowAbsPath === null) {
    return { spawnName: undefined, fsWritePath: undefined };
  }

  const flowSource = readSourceLayerBroker({ filePath: flowAbsPath });
  if (flowSource === undefined) {
    return { spawnName: undefined, fsWritePath: undefined };
  }

  return {
    spawnName: hookSpawnNameExtractTransformer({ source: flowSource }),
    fsWritePath: hookFsWritePathExtractTransformer({ source: flowSource }),
  };
};
