/**
 * PURPOSE: Renders the Boot section of the project-map for a package — startup → flows → responders → adapters
 *
 * USAGE:
 * const section = await architectureBootTreeBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 * });
 * // Returns markdown ## Boot section string matching server-map.md shape
 *
 * WHEN-TO-USE: Building per-type project-map renderers that need the universal Boot skeleton
 * WHEN-NOT-TO-USE: For library package type (libraries skip the Boot section)
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { flowNameFromFilePathTransformer } from '../../../transformers/flow-name-from-file-path/flow-name-from-file-path-transformer';
import { startupFilesFindLayerBroker } from './startup-files-find-layer-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';

export const architectureBootTreeBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText => {
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const startupFiles = startupFilesFindLayerBroker({ packageSrcPath });

  if (startupFiles.length === 0) {
    return contentTextContract.parse('## Boot\n\n```\n(no startup files found)\n```');
  }

  const allBlocks: ContentText[] = [];

  for (const startupFile of startupFiles) {
    const startupDisplay = filePathToDisplayNameTransformer({
      filePath: startupFile,
      packageSrcPath,
    });

    const flowFiles = importsInFolderTypeFindLayerBroker({
      sourceFile: startupFile,
      packageSrcPath,
      folderType: 'flows',
    });

    const flowNames = flowFiles.map((ff) => {
      const displayName = filePathToDisplayNameTransformer({ filePath: ff, packageSrcPath });
      return String(flowNameFromFilePathTransformer({ displayName }));
    });

    const startupBlockLines: ContentText[] = [startupDisplay];
    if (flowNames.length > 0) {
      startupBlockLines.push(contentTextContract.parse(`  ↳ flows/{${flowNames.join(', ')}}`));
    }
    allBlocks.push(contentTextContract.parse(startupBlockLines.map(String).join('\n')));

    for (const flowFile of flowFiles) {
      const flowDisplay = filePathToDisplayNameTransformer({ filePath: flowFile, packageSrcPath });
      const responderLines = responderLinesRenderLayerBroker({
        flowFile,
        packageSrcPath,
        renderingFilePath: startupFile,
      });

      const flowBlockLines: ContentText[] = [flowDisplay, ...responderLines];
      allBlocks.push(contentTextContract.parse(''));
      allBlocks.push(contentTextContract.parse(flowBlockLines.map(String).join('\n')));
    }
  }

  // Remove trailing empty block
  while (allBlocks.length > 0 && String(allBlocks[allBlocks.length - 1]) === '') {
    allBlocks.pop();
  }

  const body = allBlocks.map(String).join('\n');
  return contentTextContract.parse(`## Boot\n\n\`\`\`\n${body}\n\`\`\``);
};
