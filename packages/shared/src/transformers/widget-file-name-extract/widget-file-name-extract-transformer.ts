/**
 * PURPOSE: Extracts the widget name (stem without extension) from a widget file path
 *
 * USAGE:
 * widgetFileNameExtractTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx'),
 * });
 * // Returns ContentText 'quest-chat-widget'
 *
 * WHEN-TO-USE: Widget-tree broker and headline renderers deriving widget display names from file paths
 */

import { widgetTreeStatics } from '../../statics/widget-tree/widget-tree-statics';

export const widgetFileNameExtractTransformer = ({ filePath }: { filePath: string }): string => {
  const parts = filePath.split('/');
  const basename = parts[parts.length - 1] ?? filePath;

  if (basename.endsWith(widgetTreeStatics.tsxSuffix)) {
    return basename.slice(0, -widgetTreeStatics.tsxSuffix.length);
  }

  return basename.slice(0, -widgetTreeStatics.tsSuffix.length);
};
