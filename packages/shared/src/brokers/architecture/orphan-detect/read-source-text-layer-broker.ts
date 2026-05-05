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

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readSourceTextLayerBroker = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText | undefined => {
  try {
    return fsReadFileSyncAdapter({ filePath });
  } catch {
    return undefined;
  }
};
