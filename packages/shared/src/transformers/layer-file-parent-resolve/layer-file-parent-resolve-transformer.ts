/**
 * PURPOSE: Resolves the parent entry file path of a layer file by stripping the `-<discriminator>-layer` infix from the basename
 *
 * USAGE:
 * layerFileParentResolveTransformer({
 *   layerFilePath: filePathContract.parse(
 *     'packages/web/src/widgets/quest-chat/quest-chat-content-layer-widget.tsx',
 *   ),
 * });
 * // Returns FilePath 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx'
 *
 * WHEN-TO-USE: Inlining layer files under their parent entry file in project-map renderers (boot-tree, headline)
 * WHEN-NOT-TO-USE: When the input path is not a `-layer-` file (returns null instead of throwing — caller decides)
 */

import { filePathContract, type FilePath } from '../../contracts/file-path/file-path-contract';

const LAYER_BASENAME_PATTERN = /^(.+)-[^-]+-layer-([^-]+)(\.[^.]+)$/u;

export const layerFileParentResolveTransformer = ({
  layerFilePath,
}: {
  layerFilePath: FilePath;
}): FilePath | null => {
  const lastSlash = layerFilePath.lastIndexOf('/');
  const dir = lastSlash === -1 ? '' : layerFilePath.slice(0, lastSlash + 1);
  const basename = lastSlash === -1 ? layerFilePath : layerFilePath.slice(lastSlash + 1);

  const match = LAYER_BASENAME_PATTERN.exec(basename);
  if (match === null) {
    return null;
  }

  const [, parentStem, folderSuffix, extension] = match;
  return filePathContract.parse(`${dir}${parentStem}-${folderSuffix}${extension}`);
};
