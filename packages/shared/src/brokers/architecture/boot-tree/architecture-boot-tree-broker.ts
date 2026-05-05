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
import type { ResponderAnnotationMap } from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import { architectureWidgetTreeBroker } from '../widget-tree/architecture-widget-tree-broker';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureWsEdgesBroker } from '../ws-edges/architecture-ws-edges-broker';
import { architectureEventBusBroker } from '../event-bus/architecture-event-bus-broker';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';
import { startupFilesFindLayerBroker } from './startup-files-find-layer-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import type { WidgetContext } from '../../../contracts/widget-context/widget-context-contract';
import type { EventBusContext } from '../../../contracts/event-bus-context/event-bus-context-contract';
import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';

export const architectureBootTreeBroker = ({
  packageRoot,
  projectRoot,
  packageType,
  responderAnnotations,
  startupAnnotations,
}: {
  packageRoot: AbsoluteFilePath;
  projectRoot?: AbsoluteFilePath;
  packageType?: PackageType;
  responderAnnotations?: ResponderAnnotationMap;
  startupAnnotations?: ResponderAnnotationMap;
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

  const eventBusContext: EventBusContext | undefined =
    projectRoot === undefined ? undefined : architectureEventBusBroker({ projectRoot });

  const allBlocks: ContentText[] = [];
  const visited = new Set<AbsoluteFilePath>();
  const consumedWidgetResponders = new Set<AbsoluteFilePath>();

  for (const startupFile of startupFiles) {
    const startupDisplay = architectureExportNameResolveBroker({ filePath: startupFile });

    const { entries: flowFiles } = importsInFolderTypeFindLayerBroker({
      sourceFile: startupFile,
      packageSrcPath,
      folderType: 'flows',
    });

    const flowNames = flowFiles.map((ff) =>
      String(architectureExportNameResolveBroker({ filePath: ff })),
    );

    const startupAnnotation = startupAnnotations?.get(startupFile);
    const startupSuffixSource = startupAnnotation?.suffix ?? null;
    const startupSuffix = startupSuffixSource === null ? '' : `  ${String(startupSuffixSource)}`;
    const annotatedStartupLine = contentTextContract.parse(
      `${String(startupDisplay)}${startupSuffix}`,
    );
    const startupBlockLines: ContentText[] = [annotatedStartupLine];
    if (startupAnnotation !== undefined) {
      const childIndent = '      ';
      for (const cl of startupAnnotation.childLines) {
        startupBlockLines.push(contentTextContract.parse(`${childIndent}${String(cl)}`));
      }
    }
    if (flowNames.length > 0) {
      startupBlockLines.push(contentTextContract.parse(`  ↳ flows/{${flowNames.join(', ')}}`));
    }
    allBlocks.push(contentTextContract.parse(startupBlockLines.map(String).join('\n')));

    for (const flowFile of flowFiles) {
      if (visited.has(flowFile)) continue;
      visited.add(flowFile);

      const flowDisplay = architectureExportNameResolveBroker({ filePath: flowFile });
      // exactOptionalPropertyTypes forbids passing `eventBusContext: undefined` to an
      // optional field — only include it when defined.
      const baseArgs = {
        flowFile,
        packageSrcPath,
        renderingFilePath: startupFile,
        visited,
      };
      const widgetArgs =
        widgetContext === undefined ? {} : { widgetContext, consumedWidgetResponders };
      const busArgs = eventBusContext === undefined ? {} : { eventBusContext };
      const annotationArgs = responderAnnotations === undefined ? {} : { responderAnnotations };
      const responderLines = responderLinesRenderLayerBroker({
        ...baseArgs,
        ...widgetArgs,
        ...busArgs,
        ...annotationArgs,
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
