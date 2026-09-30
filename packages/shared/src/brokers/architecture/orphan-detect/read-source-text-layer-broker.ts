/**
 * PURPOSE: Reads a file's source text, returning undefined when the read fails (missing
 * file or other I/O error). Mirrors the boot-tree variant — kept local so the
 * orphan-detect domain does not import a layer file from another domain.
 *
 * USAGE:
 * const content = readSourceTextLayerBroker({ filePath });
 * // Returns ContentText or undefined
 *
 * WHEN-TO-USE: orphan-detect reachability walker reading visited files to extract their
 * import statements without crashing on edge-case missing files.
 */

import { readFileSync } from '#gateway/node/fs';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';

export const readSourceTextLayerBroker = ({
  filePath,
}: {
  filePath: string;
}): ContentText | undefined => {
  try {
    return contentTextContract.parse(readFileSync(filePath));
  } catch {
    return undefined;
  }
};
