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

import { readFileSync } from '#gateway/node/fs';

export const readWidgetSourceLayerBroker = ({
  filePath,
}: {
  filePath: string;
}): string | undefined => {
  try {
    return readFileSync(filePath);
  } catch {
    return undefined;
  }
};
