/**
 * PURPOSE: Renders a single widget root subtree (with bindings + HTTP/WS flow lines + children)
 * indented under a responder line in the boot-tree's flow diagram
 *
 * USAGE:
 * const lines = widgetSubtreeRenderLayerBroker({
 *   responderFile: absoluteFilePathContract.parse('/repo/packages/web/src/responders/app/home/app-home-responder.ts'),
 *   widgetTree,
 *   httpEdges,
 *   wsEdges,
 *   packageRoot,
 *   packageSrcPath,
 *   indent: '          ',
 * });
 * // Returns ContentText[] with every line prefixed by `indent`
 *
 * WHEN-TO-USE: Boot-tree's responder-lines renderer — for frontend-react packages, integrate
 * widget composition under each responder line
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import type { WidgetTreeResult } from '../../../contracts/widget-tree-result/widget-tree-result-contract';
import type { WidgetNode } from '../../../contracts/widget-node/widget-node-contract';
import { bindingNameToFilePathTransformer } from '../../../transformers/binding-name-to-file-path/binding-name-to-file-path-transformer';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';
import { architectureBindingFlowTraceBroker } from '../binding-flow-trace/architecture-binding-flow-trace-broker';
import { architectureWidgetNodeRenderBroker } from '../widget-node-render/architecture-widget-node-render-broker';
import { callChainLinesRenderLayerBroker } from './call-chain-lines-render-layer-broker';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';
import { importsInFolderTypeFindLayerBroker } from './imports-in-folder-type-find-layer-broker';

export const widgetSubtreeRenderLayerBroker = ({
  responderFile,
  widgetTree,
  httpEdges,
  wsEdges,
  packageRoot,
  projectRoot,
  packageSrcPath,
  indent,
}: {
  responderFile: AbsoluteFilePath;
  widgetTree: WidgetTreeResult;
  httpEdges: HttpEdge[];
  wsEdges: WsEdge[];
  packageRoot: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
  packageSrcPath: AbsoluteFilePath;
  indent: ContentText;
}): ContentText[] => {
  const { entries: widgetImports } = importsInFolderTypeFindLayerBroker({
    sourceFile: responderFile,
    packageSrcPath,
    folderType: 'widgets',
  });
  if (widgetImports.length === 0) {
    return [];
  }

  const { bindingsPrefix, bindingFlowLineSubIndent, httpMethodPadWidth } =
    projectMapHeadlineFrontendReactStatics;
  const indentStr = String(indent);
  const rootFlowIndent = `   ${bindingFlowLineSubIndent}`;

  const rootByPath = new Map<ContentText, WidgetNode>();
  for (const root of widgetTree.roots) {
    rootByPath.set(contentTextContract.parse(String(root.filePath)), root);
  }

  const lines: ContentText[] = [];

  for (const widgetFile of widgetImports) {
    const root = rootByPath.get(contentTextContract.parse(String(widgetFile)));
    if (root === undefined) continue;

    const rootDisplayName = architectureExportNameResolveBroker({ filePath: root.filePath });
    lines.push(contentTextContract.parse(`${indentStr}${String(rootDisplayName)}`));

    const chainBaseIndent = contentTextContract.parse(`${indentStr}${rootFlowIndent}`);

    for (const bindingName of root.bindingsAttached) {
      const bindingFile = bindingNameToFilePathTransformer({ bindingName, packageRoot });
      const bindingDisplayName = architectureExportNameResolveBroker({ filePath: bindingFile });
      lines.push(
        contentTextContract.parse(`${indentStr}${bindingsPrefix}${String(bindingDisplayName)}`),
      );
      const chainLines = callChainLinesRenderLayerBroker({
        sourceFile: bindingFile,
        packageSrcPath,
        renderingFilePath: bindingFile,
        baseIndent: chainBaseIndent,
      });
      for (const cl of chainLines) {
        lines.push(cl);
      }

      const { httpFlows, wsEvents } = architectureBindingFlowTraceBroker({
        bindingName,
        packageRoot,
        projectRoot,
        httpEdges,
        wsEdges,
      });

      for (const flow of httpFlows) {
        const method = String(flow.method).padEnd(httpMethodPadWidth);
        const serverPart =
          flow.serverRef === null
            ? ''
            : `  ──► ${String(flow.serverRef)}${
                flow.orchestratorMethod === null ? '' : ` → ${String(flow.orchestratorMethod)}`
              }`;
        lines.push(
          contentTextContract.parse(
            `${indentStr}${rootFlowIndent}→ ${method} ${String(flow.urlPattern)}${serverPart}`,
          ),
        );
      }

      for (const wsEvent of wsEvents) {
        const emitterSuffix =
          wsEvent.emitterRef === null ? '' : `  ←─ ${String(wsEvent.emitterRef)}`;
        lines.push(
          contentTextContract.parse(
            `${indentStr}${rootFlowIndent}ws← ${String(wsEvent.eventType)}${emitterSuffix}`,
          ),
        );
      }
    }

    const widgetChainLines = callChainLinesRenderLayerBroker({
      sourceFile: root.filePath,
      packageSrcPath,
      renderingFilePath: root.filePath,
      baseIndent: chainBaseIndent,
    });
    for (const cl of widgetChainLines) {
      lines.push(cl);
    }

    const emptyChildPrefix = contentTextContract.parse(indentStr);
    for (let i = 0; i < root.children.length; i++) {
      const child = root.children[i];
      if (child === undefined) continue;
      const childIsLast = i === root.children.length - 1;
      const childLines = architectureWidgetNodeRenderBroker({
        node: child,
        prefix: emptyChildPrefix,
        isLast: childIsLast,
        httpEdges,
        wsEdges,
        packageRoot,
        projectRoot,
        packageSrcPath,
        callChainFn: callChainLinesRenderLayerBroker,
      });
      for (const cl of childLines) {
        lines.push(cl);
      }
    }
  }

  return lines;
};
