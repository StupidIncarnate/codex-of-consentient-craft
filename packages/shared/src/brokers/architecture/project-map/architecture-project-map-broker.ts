/**
 * PURPOSE: Generate compact codebase map showing packages, folder types, file counts, and domain names for LLM orientation
 *
 * USAGE:
 * const markdown = architectureProjectMapBroker({ projectRoot: absoluteFilePathContract.parse('/home/user/project') });
 * // Returns ContentText markdown with package folders, file counts, and domain/action summaries
 *
 * WHEN-TO-USE: When LLMs need a quick orientation of what exists where before making targeted discover calls
 */

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { countFilesRecursiveLayerBroker } from './count-files-recursive-layer-broker';
import { formatFolderContentLayerBroker } from './format-folder-content-layer-broker';
import { folderConfigStatics } from '../../../statics/folder-config/folder-config-statics';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';
import { folderConfigContract } from '../../../contracts/folder-config/folder-config-contract';
import { isKeyOfGuard } from '../../../guards/is-key-of/is-key-of-guard';

export const architectureProjectMapBroker = ({
  projectRoot,
}: {
  projectRoot: AbsoluteFilePath;
}): ContentText => {
  const packagesPath = absoluteFilePathContract.parse(
    `${projectRoot}/${projectMapStatics.packagesDirName}`,
  );
  const packagesEntries = safeReaddirLayerBroker({ dirPath: packagesPath });
  const packageDirs = packagesEntries.filter((entry) => entry.isDirectory());

  const sections: ContentText[] = [contentTextContract.parse(projectMapStatics.header)];

  // Build scan targets: monorepo packages or single root
  const scanTargets: { packageName: ContentText; srcPath: AbsoluteFilePath }[] = [];

  if (packageDirs.length > 0) {
    const sortedPackages = [...packageDirs].sort((a, b) => a.name.localeCompare(b.name));

    for (const pkg of sortedPackages) {
      scanTargets.push({
        packageName: contentTextContract.parse(pkg.name),
        srcPath: absoluteFilePathContract.parse(
          `${projectRoot}/${projectMapStatics.packagesDirName}/${pkg.name}/${projectMapStatics.srcDirName}`,
        ),
      });
    }
  } else {
    scanTargets.push({
      packageName: contentTextContract.parse(projectMapStatics.rootPackageName),
      srcPath: absoluteFilePathContract.parse(`${projectRoot}/${projectMapStatics.srcDirName}`),
    });
  }

  // Build section for each scan target
  for (const { packageName, srcPath } of scanTargets) {
    const totalFiles = countFilesRecursiveLayerBroker({ dirPath: srcPath });
    const folderEntries = safeReaddirLayerBroker({ dirPath: srcPath })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    if (folderEntries.length === 0) {
      sections.push(
        contentTextContract.parse(
          `## ${packageName} (${String(totalFiles)} files)\n  ${projectMapStatics.emptyLabel}`,
        ),
      );
      continue;
    }

    const lines: ContentText[] = [
      contentTextContract.parse(`## ${packageName} (${String(totalFiles)} files)`),
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

    sections.push(contentTextContract.parse(lines.join('\n')));
  }

  return contentTextContract.parse(sections.join('\n\n'));
};
