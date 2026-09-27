/**
 * PURPOSE: Reads a file's source text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileContentsLayerBroker({ filePath: absoluteFilePathContract.parse('/src/startup/start-app.ts') });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: Boot-tree broker reading source files for import extraction — absence is expected
 * when a resolved import path resolves to a file that does not exist on disk
 */

import { readFileSync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const readFileContentsLayerBroker = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText | undefined => {
  try {
    return contentTextContract.parse(readFileSync(filePath));
  } catch {
    return undefined;
  }
};
