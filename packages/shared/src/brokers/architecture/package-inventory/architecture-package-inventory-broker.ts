/**
 * PURPOSE: Generate per-package folder/file inventory section for the project map (header line + folder rollups)
 *
 * USAGE:
 * const section = architecturePackageInventoryBroker({
 *   packageName: contentTextContract.parse('web'),
 *   srcPath: absoluteFilePathContract.parse('/repo/packages/web/src'),
 *   packageJsonPath: absoluteFilePathContract.parse('/repo/packages/web/package.json'),
 * });
 * // Returns ContentText with the package's section (header + folder lines, no leading/trailing newline)
 *
 * WHEN-TO-USE: When rendering a single package's inventory block, either composed into the full project map or returned by the get-project-inventory MCP tool
 */

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { countFilesRecursiveLayerBroker } from './count-files-recursive-layer-broker';
import { formatFolderContentLayerBroker } from './format-folder-content-layer-broker';
import { readPackageDescriptionLayerBroker } from './read-package-description-layer-broker';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { folderConfigContract } from '../../../contracts/folder-config/folder-config-contract';
import { isKeyOfGuard } from '../../../guards/is-key-of/is-key-of-guard';

export const architecturePackageInventoryBroker = ({
  packageName,
  srcPath,
  packageJsonPath,
}: {
  packageName: string;
  srcPath: string;
  packageJsonPath: string;
}): string => {
  const totalFiles = countFilesRecursiveLayerBroker({ dirPath: srcPath });
  const description = readPackageDescriptionLayerBroker({ packageJsonPath });
  const descriptionSuffix =
    description.length > 0 ? ` ${projectMapStatics.descriptionSeparator} ${description}` : '';
  const folderEntries = safeReaddirLayerBroker({ dirPath: srcPath })
    .filter((entry) => entry.kind === 'directory')
    .sort((a, b) => a.name.localeCompare(b.name));

  if (folderEntries.length === 0) {
    return `## ${packageName} (${String(totalFiles)} files)${descriptionSuffix}\n  ${projectMapStatics.emptyLabel}`;
  }

  const headerLine = `## ${packageName} (${String(totalFiles)} files)${descriptionSuffix}`;

  const folderLines = folderEntries.map((folder) => {
    const folderPath = `${srcPath}/${folder.name}`;
    const fileCount = countFilesRecursiveLayerBroker({ dirPath: folderPath });

    // Look up folder depth from config
    const folderDepth = isKeyOfGuard(folder.name, folderConfigStatics)
      ? folderConfigContract.shape.folderDepth.parse(folderConfigStatics[folder.name].folderDepth)
      : folderConfigContract.shape.folderDepth.parse(projectMapStatics.defaultFolderDepth);

    const content = formatFolderContentLayerBroker({ dirPath: folderPath, folderDepth });

    return content.length > 0
      ? `  ${folder.name}/ (${String(fileCount)}) — ${content}`
      : `  ${folder.name}/ (${String(fileCount)})`;
  });

  return [headerLine, ...folderLines].join('\n');
};
