/**
 * PURPOSE: Renders the body lines beneath a flow header — route metadata, ↳ responder lines and
 * their nested → adapter lines, and recursive child-flow chains
 *
 * USAGE:
 * const lines = responderLinesRenderLayerBroker({
 *   flowFile: '/repo/packages/server/src/flows/server/server-flow.ts',
 *   packageSrcPath: '/repo/packages/server/src',
 *   renderingFilePath: '/repo/packages/server/src/startup/start-server.ts',
 * });
 * // Returns ContentText[] with route lines, ↳ responder lines, → adapter lines, and ↳ flows/... recursion
 *
 * WHEN-TO-USE: boot-tree rendering composing the body subtree under each flow header — the caller
 * is responsible for emitting the flow's display name on its own line; this broker only renders the body
 */

import type { WidgetContext } from '../../../contracts/widget-context/widget-context-contract';
import type { EventBusContext } from '../../../contracts/event-bus-context/event-bus-context-contract';
import type { ResponderAnnotationMap } from '../../../contracts/responder-annotation-map/responder-annotation-map-contract';
import { importPathToPackagePrefixTransformer } from '../../../transformers/import-path-to-package-prefix/import-path-to-package-prefix-transformer';
import { filePathToSymbolNameTransformer } from '../../../transformers/file-path-to-symbol-name/file-path-to-symbol-name-transformer';
import { pascalCaseToKebabCaseTransformer } from '../../../transformers/pascal-case-to-kebab-case/pascal-case-to-kebab-case-transformer';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';
import { callChainLinesRenderLayerBroker } from './call-chain-lines-render-layer-broker';
import { routeMetadataExtractLayerBroker } from './route-metadata-extract-layer-broker';
import { widgetSubtreeRenderLayerBroker } from './widget-subtree-render-layer-broker';
import { busEventLinesRenderLayerBroker } from './bus-event-lines-render-layer-broker';

export const responderLinesRenderLayerBroker = ({
  flowFile,
  packageSrcPath,
  renderingFilePath,
  depth = 0,
  visited = new Set<string>(),
  widgetContext,
  consumedWidgetResponders = new Set<string>(),
  eventBusContext,
  responderAnnotations,
}: {
  flowFile: string;
  packageSrcPath: string;
  renderingFilePath: string;
  depth?: number;
  visited?: Set<string>;
  widgetContext?: WidgetContext;
  consumedWidgetResponders?: Set<string>;
  eventBusContext?: EventBusContext;
  responderAnnotations?: ResponderAnnotationMap;
}): string[] => {
  const indent = '    '.repeat(depth);
  const lines: string[] = [];

  const { entries: responders } = importsInFolderTypeFindLayerBroker({
    sourceFile: flowFile,
    packageSrcPath,
    folderType: 'responders',
  });
  const routes = routeMetadataExtractLayerBroker({ flowFile });

  const symbolToResponderFile = new Map<string, string>();
  for (const responderFile of responders) {
    const symbolName = filePathToSymbolNameTransformer({ filePath: responderFile });
    symbolToResponderFile.set(symbolName, responderFile);
  }

  const consumedResponders = new Set<string>();

  for (const route of routes) {
    const kebabSymbol = pascalCaseToKebabCaseTransformer({ pascal: route.responderSymbol });
    const responderFile = symbolToResponderFile.get(kebabSymbol);
    if (responderFile !== undefined) {
      consumedResponders.add(responderFile);
    }
    const symbol = String(route.responderSymbol);
    const prefix =
      route.path === null ? `(layout) ${symbol}` : `path="${String(route.path)}" → ${symbol}`;
    const annotation =
      responderFile === undefined ? undefined : responderAnnotations?.get(responderFile);
    const annotationSuffixSource = annotation?.suffix ?? null;
    const suffixStr = annotationSuffixSource === null ? '' : `  ${String(annotationSuffixSource)}`;
    lines.push(`${indent}  ${prefix}${suffixStr}`);
    if (annotation !== undefined) {
      const childIndent = `${indent}      `;
      for (const cl of annotation.childLines) {
        lines.push(`${childIndent}${String(cl)}`);
      }
    }

    if (
      widgetContext !== undefined &&
      responderFile !== undefined &&
      !consumedWidgetResponders.has(responderFile)
    ) {
      consumedWidgetResponders.add(responderFile);
      const widgetLines = widgetSubtreeRenderLayerBroker({
        responderFile,
        widgetTree: widgetContext.widgetTree,
        httpEdges: widgetContext.httpEdges,
        wsEdges: widgetContext.wsEdges,
        packageRoot: widgetContext.packageRoot,
        projectRoot: widgetContext.projectRoot,
        packageSrcPath,
        indent: `${indent}      `,
      });
      for (const wl of widgetLines) {
        lines.push(wl);
      }
    }
  }

  for (const responderFile of responders) {
    if (consumedResponders.has(responderFile)) continue;

    const exportName = architectureExportNameResolveBroker({ filePath: responderFile });
    let renderName: string = exportName;
    try {
      renderName = importPathToPackagePrefixTransformer({
        renderingFilePath,
        referencedFilePath: responderFile,
        symbolName: exportName,
      });
    } catch {
      // Cross-package qualification unavailable — keep the bare export name.
    }

    const annotation = responderAnnotations?.get(responderFile);
    const annotationSuffixSource = annotation?.suffix ?? null;
    const suffixStr = annotationSuffixSource === null ? '' : `  ${String(annotationSuffixSource)}`;
    lines.push(`${indent}  ↳ ${renderName}${suffixStr}`);
    if (annotation !== undefined) {
      const childIndent = `${indent}      `;
      for (const cl of annotation.childLines) {
        lines.push(`${childIndent}${String(cl)}`);
      }
    }

    const callChainLines = callChainLinesRenderLayerBroker({
      sourceFile: responderFile,
      packageSrcPath,
      renderingFilePath,
    });
    for (const al of callChainLines) {
      lines.push(`${indent}${al}`);
    }

    if (eventBusContext !== undefined) {
      const busLines = busEventLinesRenderLayerBroker({
        responderFile,
        eventBusContext,
      });
      // Indent matches the call-chain `→ adapters/...` lines so bus annotations
      // sit at the same visual depth as the responder's adapter calls.
      const busIndent = `${indent}      `;
      for (const bl of busLines) {
        lines.push(`${busIndent}${bl}`);
      }
    }

    if (widgetContext !== undefined && !consumedWidgetResponders.has(responderFile)) {
      consumedWidgetResponders.add(responderFile);
      const widgetLines = widgetSubtreeRenderLayerBroker({
        responderFile,
        widgetTree: widgetContext.widgetTree,
        httpEdges: widgetContext.httpEdges,
        wsEdges: widgetContext.wsEdges,
        packageRoot: widgetContext.packageRoot,
        projectRoot: widgetContext.projectRoot,
        packageSrcPath,
        indent: `${indent}      `,
      });
      for (const wl of widgetLines) {
        lines.push(wl);
      }
    }
  }

  const { entries: childFlows } = importsInFolderTypeFindLayerBroker({
    sourceFile: flowFile,
    packageSrcPath,
    folderType: 'flows',
  });

  for (const childFlow of childFlows) {
    const childAbsPath = String(childFlow);
    if (visited.has(childAbsPath)) continue;
    visited.add(childAbsPath);

    const childDisplay = architectureExportNameResolveBroker({ filePath: childFlow });
    lines.push(`${indent}  ↳ ${childDisplay}`);

    // exactOptionalPropertyTypes forbids passing `eventBusContext: undefined` to an
    // optional field — only include it when defined.
    const baseChildArgs = {
      flowFile: childFlow,
      packageSrcPath,
      renderingFilePath,
      depth: depth + 1,
      visited,
    };
    const widgetChildArgs =
      widgetContext === undefined ? {} : { widgetContext, consumedWidgetResponders };
    const busChildArgs = eventBusContext === undefined ? {} : { eventBusContext };
    const annotationChildArgs = responderAnnotations === undefined ? {} : { responderAnnotations };
    const childLines = responderLinesRenderLayerBroker({
      ...baseChildArgs,
      ...widgetChildArgs,
      ...busChildArgs,
      ...annotationChildArgs,
    });
    for (const cl of childLines) {
      lines.push(cl);
    }
  }

  return lines;
};
