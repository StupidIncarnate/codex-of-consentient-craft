/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/flows/quest/quest-flow.ts'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: Edge-graph broker reading flow and broker source files — absence is silently skipped
 */

import { readFileSync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const readFileLayerBroker = ({
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
