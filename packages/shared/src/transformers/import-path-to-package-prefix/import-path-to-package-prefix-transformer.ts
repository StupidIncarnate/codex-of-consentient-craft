/**
 * PURPOSE: Returns the rendering token for a referenced symbol — bare name when the source file is in the same package as the rendering file, or a `<otherPkg>/<folder-type>/<symbolName>` qualified token when cross-package
 *
 * USAGE:
 * importPathToPackagePrefixTransformer({
 *   renderingFilePath: AbsoluteFilePathStub({ value: '/repo/packages/server/src/responders/quest/start/quest-start-responder.ts' }),
 *   referencedFilePath: AbsoluteFilePathStub({ value: '/repo/packages/shared/src/brokers/port-resolve/port-resolve-broker.ts' }),
 *   symbolName: 'portResolveBroker',
 * });
 * // Returns ContentText 'shared/brokers/portResolveBroker'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';

const PACKAGE_PATH_PATTERN = /\/packages\/([^/]+)\/src\/([^/]+)\//u;
const OUT_OF_BOUNDS_MESSAGE =
  'importPathToPackagePrefixTransformer: file path is not under any packages/<pkg>/src/';

export const importPathToPackagePrefixTransformer = ({
  renderingFilePath,
  referencedFilePath,
  symbolName,
}: {
  renderingFilePath: AbsoluteFilePath;
  referencedFilePath: AbsoluteFilePath;
  symbolName: string;
}): ContentText => {
  const renderingMatch = PACKAGE_PATH_PATTERN.exec(renderingFilePath);
  if (renderingMatch === null) {
    throw new Error(`${OUT_OF_BOUNDS_MESSAGE} — got "${renderingFilePath}"`);
  }
  const referencedMatch = PACKAGE_PATH_PATTERN.exec(referencedFilePath);
  if (referencedMatch === null) {
    throw new Error(`${OUT_OF_BOUNDS_MESSAGE} — got "${referencedFilePath}"`);
  }

  const [, renderingPackage] = renderingMatch;
  const [, referencedPackage, referencedFolder] = referencedMatch;
  if (
    renderingPackage === undefined ||
    referencedPackage === undefined ||
    referencedFolder === undefined
  ) {
    throw new Error(
      `${OUT_OF_BOUNDS_MESSAGE} — got rendering="${renderingFilePath}" referenced="${referencedFilePath}"`,
    );
  }

  if (renderingPackage === referencedPackage) {
    return contentTextContract.parse(symbolName);
  }

  return contentTextContract.parse(`${referencedPackage}/${referencedFolder}/${symbolName}`);
};
