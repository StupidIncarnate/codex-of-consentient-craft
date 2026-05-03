/**
 * PURPOSE: Renders the Boot section of the project-map for a package — startup → flows → responders → adapters,
 * with widget composition + bindings + HTTP/WS edges integrated under each responder for frontend-react packages
 *
 * USAGE:
 * const section = architectureBootTreeBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/server'),
 *   projectRoot: absoluteFilePathContract.parse('/repo'),
 *   packageType: packageTypeContract.parse('http-backend'),
 * });
 * // Returns markdown ## Boot section string
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
import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import { filePathToDisplayNameTransformer } from '../../../transformers/file-path-to-display-name/file-path-to-display-name-transformer';
import { flowNameFromFilePathTransformer } from '../../../transformers/flow-name-from-file-path/flow-name-from-file-path-transformer';
import { architectureWidgetTreeBroker } from '../widget-tree/architecture-widget-tree-broker';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureWsEdgesBroker } from '../ws-edges/architecture-ws-edges-broker';
import { startupFilesFindLayerBroker } from './startup-files-find-layer-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import type { WidgetContext } from '../../../contracts/widget-context/widget-context-contract';
import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';

export const architectureBootTreeBroker = ({
  packageRoot,
  projectRoot,
  packageType,
}: {
  packageRoot: AbsoluteFilePath;
  projectRoot?: AbsoluteFilePath;
  packageType?: PackageType;
}): ContentText => {
  const packageSrcPath = absoluteFilePathContract.parse(`${String(packageRoot)}/src`);
  const startupFiles = startupFilesFindLayerBroker({ packageSrcPath });

  if (startupFiles.length === 0) {
    return contentTextContract.parse('## Boot\n\n```\n(no startup files found)\n```');
  }

  const widgetContext: WidgetContext | undefined =
    packageType === 'frontend-react' && projectRoot !== undefined
      ? {
          widgetTree: architectureWidgetTreeBroker({ packageRoot }),
          httpEdges: architectureEdgeGraphBroker({ projectRoot }),
          wsEdges: architectureWsEdgesBroker({ projectRoot }),
          packageRoot,
          projectRoot,
        }
      : undefined;

  const allBlocks: ContentText[] = [];
  const visited = new Set<AbsoluteFilePath>();
  const consumedWidgetResponders = new Set<AbsoluteFilePath>();

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
      if (visited.has(flowFile)) continue;
      visited.add(flowFile);

      const flowDisplay = filePathToDisplayNameTransformer({ filePath: flowFile, packageSrcPath });
      const responderLines =
        widgetContext === undefined
          ? responderLinesRenderLayerBroker({
              flowFile,
              packageSrcPath,
              renderingFilePath: startupFile,
              visited,
            })
          : responderLinesRenderLayerBroker({
              flowFile,
              packageSrcPath,
              renderingFilePath: startupFile,
              visited,
              widgetContext,
              consumedWidgetResponders,
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
