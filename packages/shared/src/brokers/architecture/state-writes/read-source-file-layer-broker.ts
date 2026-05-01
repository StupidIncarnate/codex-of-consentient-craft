/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readSourceFileLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/broker.ts'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: State-writes broker reading source files for adapter-caller and browser-storage
 * extraction — absence is silently skipped
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readSourceFileLayerBroker = ({
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
