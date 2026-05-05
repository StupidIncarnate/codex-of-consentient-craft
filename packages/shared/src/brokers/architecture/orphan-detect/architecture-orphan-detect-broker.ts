/**
 * PURPOSE: Detects orphaned source files in a package — files that live in walked
 * folder types (adapters, bindings, brokers, flows, middleware, migrations,
 * responders, startup, state, widgets) but are not reachable from any startup file
 * via the import graph. Returns a `## Unreferenced` markdown section listing each
 * orphan as a slash-path display name, sorted alphabetically. Returns an empty
 * string when no orphans exist so the caller can omit the section entirely.
 *
 * USAGE:
 * const section = architectureOrphanDetectBroker({
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/server/src'),
 * });
 * // Returns ContentText markdown header + code block, or empty string if no orphans
 *
 * WHEN-TO-USE: package-section-build-layer-broker appending the Unreferenced section
 * after each package's boot tree in the project-map output.
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { listWalkedFolderFilesLayerBroker } from './list-walked-folder-files-layer-broker';
import { walkReachableFilesLayerBroker } from './walk-reachable-files-layer-broker';

export const architectureOrphanDetectBroker = ({
  packageSrcPath,
}: {
  packageSrcPath: AbsoluteFilePath;
}): ContentText => {
  const candidates = listWalkedFolderFilesLayerBroker({ packageSrcPath });
  const reachable = walkReachableFilesLayerBroker({ packageSrcPath });

  const orphans: ContentText[] = [];
  for (const candidate of candidates) {
    if (reachable.has(candidate)) continue;
    orphans.push(filePathToDisplayNameTransformer({ filePath: candidate, packageSrcPath }));
  }

  if (orphans.length === 0) {
    return contentTextContract.parse('');
  }

  const sortedDisplay = orphans.map(String).sort((a, b) => a.localeCompare(b));
  const body = sortedDisplay.join('\n');
  return contentTextContract.parse(`## Unreferenced\n\n\`\`\`\n${body}\n\`\`\``);
};
