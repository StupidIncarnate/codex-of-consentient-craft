/**
 * PURPOSE: Formats folder content summaries based on folder depth configuration
 *
 * USAGE:
 * const content = formatFolderContentLayerBroker({
 *   dirPath: '/project/src/brokers',
 *   folderDepth: folderConfigContract.shape.folderDepth.parse(2),
 * });
 * // Returns ContentText like "guild (create, detail, list), quest (modify, start)"
 *
 * WHEN-TO-USE: When building the project map and need formatted summaries per folder type
 */

import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { countFilesRecursiveLayerBroker } from './count-files-recursive-layer-broker';
import type { FolderConfig } from '../../../contracts/folder-config/folder-config-contract';

type FolderDepth = FolderConfig['folderDepth'];

export const formatFolderContentLayerBroker = ({
  dirPath,
  folderDepth,
}: {
  dirPath: string;
  folderDepth: FolderDepth;
}): string => {
  // Depth 0: list file stems (strip extension)
  if (folderDepth === projectMapStatics.depth0) {
    const entries = safeReaddirLayerBroker({ dirPath });
    const fileNames = entries
      .filter((entry) => entry.kind !== 'directory')
      .map((entry) => {
        const dotIndex = entry.name.lastIndexOf('.');
        return dotIndex > 0 ? entry.name.slice(0, dotIndex) : entry.name;
      });

    return fileNames.join(', ');
  }

  // Depth 2: list domain/ (action1/, action2/) pairs
  if (folderDepth === projectMapStatics.depth2) {
    const domains = safeReaddirLayerBroker({ dirPath })
      .filter((entry) => entry.kind === 'directory')
      .filter((entry) => {
        const domainPath = `${dirPath}/${entry.name}`;
        return countFilesRecursiveLayerBroker({ dirPath: domainPath }) > 0;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const domainParts: string[] = [];

    for (const domain of domains) {
      const domainPath = `${dirPath}/${domain.name}`;
      const actions = safeReaddirLayerBroker({ dirPath: domainPath })
        .filter((entry) => entry.kind === 'directory')
        .filter((entry) => {
          const actionPath = `${domainPath}/${entry.name}`;
          return countFilesRecursiveLayerBroker({ dirPath: actionPath }) > 0;
        })
        .map((entry) => `${entry.name}/`)
        .sort();

      if (actions.length > 0) {
        domainParts.push(`${domain.name}/ (${actions.join(', ')})`);
      } else {
        domainParts.push(`${domain.name}/`);
      }
    }

    return domainParts.join(', ');
  }

  // Depth 1 (default): list first-level subdirectory names
  const entries = safeReaddirLayerBroker({ dirPath });
  const subdirNames = entries
    .filter((entry) => entry.kind === 'directory')
    .filter((entry) => {
      const subdirPath = `${dirPath}/${entry.name}`;
      return countFilesRecursiveLayerBroker({ dirPath: subdirPath }) > 0;
    })
    .map((entry) => `${entry.name}/`)
    .sort();

  return subdirNames.join(', ');
};
