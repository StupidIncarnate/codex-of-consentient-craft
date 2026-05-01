/**
 * PURPOSE: Recursively lists all non-test widget source files under a package's src/widgets/ directory
 *
 * USAGE:
 * const files = listWidgetFilesLayerBroker({
 *   widgetsDirPath: absoluteFilePathContract.parse('/repo/packages/web/src/widgets'),
 * });
 * // Returns AbsoluteFilePath[] for every *-widget.{ts,tsx} that passes isNonTestFileGuard
 *
 * WHEN-TO-USE: Widget-tree broker collecting the widget file set to build the composition graph
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { matchesWidgetFileNameGuard } from '../../../guards/matches-widget-file-name/matches-widget-file-name-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listWidgetFilesLayerBroker = ({
  widgetsDirPath,
}: {
  widgetsDirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const entries = safeReaddirLayerBroker({ dirPath: widgetsDirPath });
  const results: AbsoluteFilePath[] = [];

  for (const entry of entries) {
    const entryPath = absoluteFilePathContract.parse(`${String(widgetsDirPath)}/${entry.name}`);

    if (entry.isDirectory()) {
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
