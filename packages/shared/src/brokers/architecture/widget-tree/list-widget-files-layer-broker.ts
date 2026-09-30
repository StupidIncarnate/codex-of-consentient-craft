/**
 * PURPOSE: Recursively lists all non-test widget source files under a package's src/widgets/ directory
 *
 * USAGE:
 * const files = listWidgetFilesLayerBroker({
 *   widgetsDirPath: '/repo/packages/web/src/widgets',
 * });
 * // Returns AbsoluteFilePath[] for every *-widget.{ts,tsx} that passes isNonTestFileGuard
 *
 * WHEN-TO-USE: Widget-tree broker collecting the widget file set to build the composition graph
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { matchesWidgetFileNameGuard } from '../../../guards/matches-widget-file-name/matches-widget-file-name-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listWidgetFilesLayerBroker = ({
  widgetsDirPath,
}: {
  widgetsDirPath: string;
}): string[] => {
  const entries = safeReaddirLayerBroker({ dirPath: widgetsDirPath });
  const results: string[] = [];

  for (const entry of entries) {
    const entryPath = `${widgetsDirPath}/${entry.name}`;

    if (entry.kind === 'directory') {
      const children = listWidgetFilesLayerBroker({ widgetsDirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (
      matchesWidgetFileNameGuard({ name: entry.name }) &&
      isNonTestFileGuard({ filePath: entryPath })
    ) {
      results.push(entryPath);
    }
  }

  return results;
};
