/**
 * PURPOSE: Renders an adapter file path as its parent-folder slash-path (drops the kebab basename),
 * qualified with `<pkg>/` when the rendering file is in a different package
 *
 * USAGE:
 * adapterFilePathToDisplayTransformer({
 *   filePath: AbsoluteFilePathStub({ value: '/repo/packages/server/src/adapters/orchestrator/get-quest/orchestrator-get-quest-adapter.ts' }),
 *   renderingFilePath: AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
 * });
 * // Returns ContentText 'adapters/orchestrator/get-quest'  (same package — bare slash-path)
 *
 * adapterFilePathToDisplayTransformer({
 *   filePath: AbsoluteFilePathStub({ value: '/repo/packages/web/src/adapters/fetch/post/fetch-post-adapter.ts' }),
 *   renderingFilePath: AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/start-server.ts' }),
 * });
 * // Returns ContentText 'web/adapters/fetch/post'  (cross-package — prefixed)
 *
 * WHEN-TO-USE: Boot-tree adapter-line renderer producing the structural slash-path token that
 * tmp/server-map.md expects (e.g. `adapters/orchestrator/get-quest` not the kebab basename)
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const PACKAGE_PATH_PATTERN = /\/packages\/([^/]+)\/src\//u;
const OUT_OF_BOUNDS_MESSAGE =
  'adapterFilePathToDisplayTransformer: file path is not under any packages/<pkg>/src/';

export const adapterFilePathToDisplayTransformer = ({
  filePath,
  renderingFilePath,
}: {
  filePath: AbsoluteFilePath;
  renderingFilePath: AbsoluteFilePath;
}): ContentText => {
  const referencedMatch = PACKAGE_PATH_PATTERN.exec(String(filePath));
  if (referencedMatch === null) {
    throw new Error(`${OUT_OF_BOUNDS_MESSAGE} — got "${String(filePath)}"`);
  }
  const renderingMatch = PACKAGE_PATH_PATTERN.exec(String(renderingFilePath));
  if (renderingMatch === null) {
    throw new Error(`${OUT_OF_BOUNDS_MESSAGE} — got "${String(renderingFilePath)}"`);
  }

  const [, referencedPackage] = referencedMatch;
  const [, renderingPackage] = renderingMatch;
  if (referencedPackage === undefined || renderingPackage === undefined) {
    throw new Error(
      `${OUT_OF_BOUNDS_MESSAGE} — got rendering="${String(renderingFilePath)}" referenced="${String(filePath)}"`,
    );
  }

  const filePathStr = String(filePath);
  const afterSrc = filePathStr.slice(referencedMatch.index + referencedMatch[0].length);
  const lastSlashInRelative = afterSrc.lastIndexOf('/');
  const parentRelative =
    lastSlashInRelative === -1 ? afterSrc : afterSrc.slice(0, lastSlashInRelative);

  if (referencedPackage === renderingPackage) {
    return contentTextContract.parse(parentRelative);
  }

  return contentTextContract.parse(`${referencedPackage}/${parentRelative}`);
};
