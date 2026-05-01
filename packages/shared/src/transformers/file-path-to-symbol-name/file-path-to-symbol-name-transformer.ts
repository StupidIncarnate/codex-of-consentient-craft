/**
 * PURPOSE: Extracts the symbol name from a file path — the basename without its file extension
 *
 * USAGE:
 * filePathToSymbolNameTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/responders/quest/start/quest-start-responder.ts'),
 * });
 * // Returns ContentText 'quest-start-responder'
 *
 * WHEN-TO-USE: Boot-tree renderer deriving the symbol name for import-path-to-package-prefix
 * rendering — the symbol name is the kebab-case identifier used in imports
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const filePathToSymbolNameTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText => {
  const filePathStr = String(filePath);
  const lastSlash = filePathStr.lastIndexOf('/');
  const basename = lastSlash === -1 ? filePathStr : filePathStr.slice(lastSlash + 1);
  const dot = basename.lastIndexOf('.');
  const stem = dot === -1 ? basename : basename.slice(0, dot);
  return contentTextContract.parse(stem);
};
