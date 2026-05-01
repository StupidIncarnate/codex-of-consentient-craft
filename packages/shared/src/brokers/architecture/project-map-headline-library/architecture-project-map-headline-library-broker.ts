/**
 * PURPOSE: Renders the Library exports and Consumers sections for a library package
 * in the project-map connection-graph view. The Library exports section lists each
 * barrel subpath from package.json exports and the count of non-test source files
 * in the corresponding src/ folder. When the statics barrel is present and its file
 * count is below projectMapStatics.staticsInlineThreshold, the statics folder names
 * are listed inline. The Consumers section aggregates cross-package import edges.
 *
 * USAGE:
 * const markdown = architectureProjectMapHeadlineLibraryBroker({
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/shared'),
 *   packageName: contentTextContract.parse('shared'),
 * });
 * // Returns ContentText markdown with ## Library exports and ## Consumers sections
 *
 * WHEN-TO-USE: As the headline renderer for packages detected as library type
 * WHEN-NOT-TO-USE: For non-library packages
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import { projectMapHeadlineLibraryStatics } from '../../../statics/project-map-headline-library/project-map-headline-library-statics';
import { readPackageJsonLayerBroker } from './read-package-json-layer-broker';
import { countBarrelFilesLayerBroker } from './count-barrel-files-layer-broker';
import { listStaticsFoldersLayerBroker } from './list-statics-folders-layer-broker';
import { consumersSectionRenderLayerBroker } from './consumers-section-render-layer-broker';

export const architectureProjectMapHeadlineLibraryBroker = ({
  projectRoot,
  packageRoot,
  packageName,
}: {
  projectRoot: AbsoluteFilePath;
  packageRoot: AbsoluteFilePath;
  packageName: ContentText;
}): ContentText => {
  const barrelNames = readPackageJsonLayerBroker({ packageRoot });

  const exportLines: ContentText[] = [];
  for (const barrel of barrelNames) {
    const barrelStr = String(barrel);
    const barrelDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/${barrelStr}`);
    const fileCount = countBarrelFilesLayerBroker({ dirPath: barrelDir });

    const packageRef = `@dungeonmaster/${String(packageName)}/${barrelStr}`;

    if (
      barrelStr === projectMapHeadlineLibraryStatics.staticsBarrelName &&
      fileCount < projectMapStatics.staticsInlineThreshold
    ) {
      const staticsFolders = listStaticsFoldersLayerBroker({ packageRoot });
      if (staticsFolders.length > 0) {
        const namesList = staticsFolders.map(String).join(', ');
        exportLines.push(
          contentTextContract.parse(
            `${packageRef}    (${String(fileCount)} ${projectMapHeadlineLibraryStatics.fileCountSuffix}) — ${namesList}`,
          ),
        );
        continue;
      }
    }

    exportLines.push(
      contentTextContract.parse(
        `${packageRef}    (${String(fileCount)} ${projectMapHeadlineLibraryStatics.fileCountSuffix})`,
      ),
    );
  }

  const header = projectMapHeadlineLibraryStatics.libraryExportsSectionHeader;
  const exportSection =
    exportLines.length === 0
      ? contentTextContract.parse(`${header}\n${projectMapHeadlineLibraryStatics.noExportsLine}`)
      : contentTextContract.parse(
          `${header}\n\n\`\`\`\n${exportLines.map(String).join('\n')}\n\`\`\``,
        );

  const consumersSection = consumersSectionRenderLayerBroker({ projectRoot, packageName });

  return contentTextContract.parse(
    `${String(exportSection)}\n\n---\n\n${String(consumersSection)}`,
  );
};
