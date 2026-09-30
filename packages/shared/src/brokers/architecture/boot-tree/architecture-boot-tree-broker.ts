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

import type { PackageType } from '../../../contracts/package-type/package-type-contract';
import type { ResponderAnnotationMap } from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import { architectureWidgetTreeBroker } from '../widget-tree/architecture-widget-tree-broker';
import { architectureEdgeGraphBroker } from '../edge-graph/architecture-edge-graph-broker';
import { architectureWsEdgesBroker } from '../ws-edges/architecture-ws-edges-broker';
import { architectureEventBusBroker } from '../event-bus/architecture-event-bus-broker';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';
import { startupFilesFindLayerBroker } from './startup-files-find-layer-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import {
  widgetContextContract,
  type WidgetContext,
} from '../../../contracts/widget-context/widget-context-contract';
import type { EventBusContext } from '../../../contracts/event-bus-context/event-bus-context-contract';
import { responderLinesRenderLayerBroker } from './responder-lines-render-layer-broker';

export const architectureBootTreeBroker = ({
  packageRoot,
  projectRoot,
  packageType,
  responderAnnotations,
  startupAnnotations,
}: {
  packageRoot: string;
  projectRoot?: string;
  packageType?: PackageType;
  responderAnnotations?: ResponderAnnotationMap;
  startupAnnotations?: ResponderAnnotationMap;
}): string => {
  const packageSrcPath = `${packageRoot}/src`;
  const startupFiles = startupFilesFindLayerBroker({ packageSrcPath });

  if (startupFiles.length === 0) {
    return '## Boot\n\n```\n(no startup files found)\n```';
  }

  const widgetContext: WidgetContext | undefined =
    packageType === 'frontend-react' && projectRoot !== undefined
      ? widgetContextContract.parse({
          widgetTree: architectureWidgetTreeBroker({ packageRoot }),
          httpEdges: architectureEdgeGraphBroker({ projectRoot }),
          wsEdges: architectureWsEdgesBroker({ projectRoot }),
          packageRoot,
          projectRoot,
        })
      : undefined;

  const eventBusContext: EventBusContext | undefined =
    projectRoot === undefined ? undefined : architectureEventBusBroker({ projectRoot });

  const allBlocks: string[] = [];
  const visited = new Set<string>();
  const consumedWidgetResponders = new Set<string>();

  for (const startupFile of startupFiles) {
    const startupDisplay = architectureExportNameResolveBroker({ filePath: startupFile });

    const { entries: flowFiles } = importsInFolderTypeFindLayerBroker({
      sourceFile: startupFile,
      packageSrcPath,
      folderType: 'flows',
    });

    const flowNames = flowFiles.map((ff) =>
      architectureExportNameResolveBroker({ filePath: ff }),
    );

    const startupAnnotation = startupAnnotations?.get(startupFile);
    const startupSuffixSource = startupAnnotation?.suffix ?? null;
    const startupSuffix = startupSuffixSource === null ? '' : `  ${String(startupSuffixSource)}`;
    const annotatedStartupLine = `${startupDisplay}${startupSuffix}`;
    const startupBlockLines: string[] = [annotatedStartupLine];
    if (startupAnnotation !== undefined) {
      const childIndent = '      ';
      for (const cl of startupAnnotation.childLines) {
        startupBlockLines.push(`${childIndent}${String(cl)}`);
      }
    }
    if (flowNames.length > 0) {
      startupBlockLines.push(`  ↳ flows/{${flowNames.join(', ')}}`);
    }
    allBlocks.push(startupBlockLines.map(String).join('\n'));

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

      const flowBlockLines: string[] = [flowDisplay, ...responderLines];
      allBlocks.push('');
      allBlocks.push(flowBlockLines.map(String).join('\n'));
    }
  }

  // Remove trailing empty block
  while (allBlocks.length > 0 && String(allBlocks[allBlocks.length - 1]) === '') {
    allBlocks.pop();
  }

  const body = allBlocks.map(String).join('\n');
  return `## Boot\n\n\`\`\`\n${body}\n\`\`\``;
};
