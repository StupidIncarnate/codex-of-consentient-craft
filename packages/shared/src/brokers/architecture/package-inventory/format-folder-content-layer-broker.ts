/**
 * PURPOSE: Formats folder content summaries based on folder depth configuration
 *
 * USAGE:
 * const content = formatFolderContentLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/project/src/brokers'),
 *   folderDepth: folderConfigContract.shape.folderDepth.parse(2),
 * });
 * // Returns ContentText like "guild (create, detail, list), quest (modify, start)"
 *
 * WHEN-TO-USE: When building the project map and need formatted summaries per folder type
 */

import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { countFilesRecursiveLayerBroker } from './count-files-recursive-layer-broker';
import type { FolderConfig } from '../../../contracts/folder-config/folder-config-contract';

type FolderDepth = FolderConfig['folderDepth'];

export const formatFolderContentLayerBroker = ({
  dirPath,
  folderDepth,
}: {
  dirPath: AbsoluteFilePath;
  folderDepth: FolderDepth;
}): ContentText => {
  // Depth 0: list file stems (strip extension)
  if (folderDepth === projectMapStatics.depth0) {
    const entries = safeReaddirLayerBroker({ dirPath });
    const fileNames = entries
      .filter((entry) => !entry.isDirectory())
      .map((entry) => {
        const dotIndex = entry.name.lastIndexOf('.');
        return dotIndex > 0 ? entry.name.slice(0, dotIndex) : entry.name;
      });

    return contentTextContract.parse(fileNames.join(', '));
  }

  // Depth 2: list domain/ (action1/, action2/) pairs
  if (folderDepth === projectMapStatics.depth2) {
    const domains = safeReaddirLayerBroker({ dirPath })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => {
        const domainPath = absoluteFilePathContract.parse(`${dirPath}/${entry.name}`);
        return countFilesRecursiveLayerBroker({ dirPath: domainPath }) > 0;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const domainParts: ContentText[] = [];

    for (const domain of domains) {
      const domainPath = absoluteFilePathContract.parse(`${dirPath}/${domain.name}`);
      const actions = safeReaddirLayerBroker({ dirPath: domainPath })
        .filter((entry) => entry.isDirectory())
        .filter((entry) => {
          const actionPath = absoluteFilePathContract.parse(`${domainPath}/${entry.name}`);
          return countFilesRecursiveLayerBroker({ dirPath: actionPath }) > 0;
        })
        .map((entry) => `${entry.name}/`)
        .sort();

      if (actions.length > 0) {
        domainParts.push(contentTextContract.parse(`${domain.name}/ (${actions.join(', ')})`));
      } else {
        domainParts.push(contentTextContract.parse(`${domain.name}/`));
      }
    }

    return contentTextContract.parse(domainParts.join(', '));
  }

  // Depth 1 (default): list first-level subdirectory names
  const entries = safeReaddirLayerBroker({ dirPath });
  const subdirNames = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const subdirPath = absoluteFilePathContract.parse(`${dirPath}/${entry.name}`);
      return countFilesRecursiveLayerBroker({ dirPath: subdirPath }) > 0;
    })
    .map((entry) => `${entry.name}/`)
    .sort();

  return contentTextContract.parse(subdirNames.join(', '));
};
