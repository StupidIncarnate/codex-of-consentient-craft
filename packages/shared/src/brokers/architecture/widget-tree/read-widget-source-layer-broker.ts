/**
 * PURPOSE: Reads a widget source file's text, returning undefined when the file does not exist
 *
 * USAGE:
 * const content = readWidgetSourceLayerBroker({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx'),
 * });
 * // Returns ContentText or undefined if file is missing
 *
 * WHEN-TO-USE: Widget-tree broker reading widget files for import extraction — absence is silently skipped
 */

import { fsReadFileSyncAdapter } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const readWidgetSourceLayerBroker = ({
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
