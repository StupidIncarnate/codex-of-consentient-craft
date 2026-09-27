/**
 * PURPOSE: Reads a file's content returning undefined when the file does not exist instead of throwing
 *
 * USAGE:
 * const content = readFileOptionalLayerBroker({ filePath: absoluteFilePathContract.parse('/project/package.json') });
 * // Returns ContentText string or undefined if file is missing
 *
 * WHEN-TO-USE: When reading optional files during e2e eligibility detection where absence is expected
 */

import { readFileSync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readFileOptionalLayerBroker = ({
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
