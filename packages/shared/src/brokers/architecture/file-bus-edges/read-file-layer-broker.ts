/**
 * PURPOSE: Reads a source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readFileLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: File-bus-edges broker reading source files — absence is silently skipped
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readFileLayerBroker = ({
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
