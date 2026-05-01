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
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { folderConfigContract } from '../../../contracts/folder-config/folder-config-contract';
import { isKeyOfGuard } from '../../../guards/is-key-of/is-key-of-guard';

export const architecturePackageInventoryBroker = ({
  packageName,
  srcPath,
  packageJsonPath,
}: {
  packageName: ContentText;
  srcPath: AbsoluteFilePath;
  packageJsonPath: AbsoluteFilePath;
}): ContentText => {
  const totalFiles = countFilesRecursiveLayerBroker({ dirPath: srcPath });
  const description = readPackageDescriptionLayerBroker({ packageJsonPath });
  const descriptionSuffix =
    description.length > 0 ? ` ${projectMapStatics.descriptionSeparator} ${description}` : '';
  const folderEntries = safeReaddirLayerBroker({ dirPath: srcPath })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  if (folderEntries.length === 0) {
    return contentTextContract.parse(
      `## ${packageName} (${String(totalFiles)} files)${descriptionSuffix}\n  ${projectMapStatics.emptyLabel}`,
    );
  }

  const lines: ContentText[] = [
    contentTextContract.parse(
      `## ${packageName} (${String(totalFiles)} files)${descriptionSuffix}`,
    ),
  ];

  for (const folder of folderEntries) {
    const folderPath = absoluteFilePathContract.parse(`${srcPath}/${folder.name}`);
    const fileCount = countFilesRecursiveLayerBroker({ dirPath: folderPath });

    // Look up folder depth from config
    const folderDepth = isKeyOfGuard(folder.name, folderConfigStatics)
      ? folderConfigContract.shape.folderDepth.parse(folderConfigStatics[folder.name].folderDepth)
      : folderConfigContract.shape.folderDepth.parse(projectMapStatics.defaultFolderDepth);

    const content = formatFolderContentLayerBroker({ dirPath: folderPath, folderDepth });

    if (content.length > 0) {
      lines.push(
        contentTextContract.parse(`  ${folder.name}/ (${String(fileCount)}) — ${content}`),
      );
    } else {
      lines.push(contentTextContract.parse(`  ${folder.name}/ (${String(fileCount)})`));
    }
  }

  return contentTextContract.parse(lines.join('\n'));
};
