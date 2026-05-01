/**
 * PURPOSE: Reads a TypeScript source file's text content, returning undefined when
 * the file does not exist or cannot be read.
 *
 * USAGE:
 * const source = readSourceLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts'),
 * });
 * // Returns ContentText or undefined if the file is missing
 *
 * WHEN-TO-USE: hook-handlers headline broker reading startup, flow, and responder source files
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readSourceLayerBroker = ({
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
