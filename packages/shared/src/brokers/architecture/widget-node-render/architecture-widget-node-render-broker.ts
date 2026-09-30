/**
 * PURPOSE: Renders a single WidgetNode as tree-style ASCII lines (used recursively for children).
 * Each node shows its name and bindings, followed by recursively rendered grandchildren
 *
 * USAGE:
 * const lines = architectureWidgetNodeRenderBroker({
 *   node,
 *   prefix: contentTextContract.parse(''),
 *   isLast: true,
 *   httpEdges: [],
 *   wsEdges: [],
 *   packageRoot,
 * });
 * // Returns ContentText[] with tree connector lines for the node and its descendants
 *
 * WHEN-TO-USE: Project-map renderers building widget composition trees — both standalone
 * widget tree section and the boot-tree's per-responder widget subtree
 */

import type { WidgetNode } from '../../../contracts/widget-node/widget-node-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import { bindingNameToFilePathTransformer } from '../../../transformers/binding-name-to-file-path/binding-name-to-file-path-transformer';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';
import { architectureBindingFlowTraceBroker } from '../binding-flow-trace/architecture-binding-flow-trace-broker';
import { architectureExportNameResolveBroker } from '../export-name-resolve/architecture-export-name-resolve-broker';

export const architectureWidgetNodeRenderBroker = ({
  node,
  prefix,
  isLast,
  httpEdges,
  wsEdges,
  packageRoot,
  projectRoot,
  packageSrcPath,
  callChainFn,
}: {
  node: WidgetNode;
  prefix: string;
  isLast: boolean;
  httpEdges: HttpEdge[];
  wsEdges: WsEdge[];
  packageRoot: string;
  projectRoot: string;
  packageSrcPath?: string;
  callChainFn?: (params: {
    sourceFile: string;
    packageSrcPath: string;
    renderingFilePath: string;
    baseIndent?: string;
  }) => string[];
}): string[] => {
  const { pipe, branch, last, indent } = projectMapHeadlineFrontendReactStatics.treeConnectors;
  const { bindingFlowLineSubIndent, httpMethodPadWidth } = projectMapHeadlineFrontendReactStatics;
  const connector = isLast ? last : branch;
  const lines: string[] = [];

  const widgetDisplayName = architectureExportNameResolveBroker({ filePath: node.filePath });
  lines.push(
    `${String(prefix)}${connector} ${String(widgetDisplayName)}`,
  );

  const childIndentStr = isLast ? `${String(prefix)}${indent}` : `${String(prefix)}${pipe}  `;
  const flowIndent = `${childIndentStr}${bindingFlowLineSubIndent}`;
  const chainBaseIndent = flowIndent;

  for (const bindingName of node.bindingsAttached) {
    const bindingFile = bindingNameToFilePathTransformer({ bindingName, packageRoot });
    const bindingDisplayName = architectureExportNameResolveBroker({ filePath: bindingFile });
    lines.push(
      `${childIndentStr}bindings: ${String(bindingDisplayName)}`,
    );

    if (callChainFn !== undefined && packageSrcPath !== undefined) {
      const chainLines = callChainFn({
        sourceFile: bindingFile,
        packageSrcPath,
        renderingFilePath: bindingFile,
        baseIndent: chainBaseIndent,
      });
      for (const cl of chainLines) {
        lines.push(cl);
      }
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
      const flowSuffix =
        flow.serverRef === null
          ? ''
          : `  ──► ${String(flow.serverRef)}${flow.orchestratorMethod === null ? '' : ` → ${String(flow.orchestratorMethod)}`}`;
      lines.push(
        `${flowIndent}→ ${method} ${String(flow.urlPattern)}${flowSuffix}`,
      );
    }

    for (const ws of wsEvents) {
      const emitterSuffix = ws.emitterRef === null ? '' : `  ←─ ${String(ws.emitterRef)}`;
      lines.push(
        `${flowIndent}ws← ${String(ws.eventType)}${emitterSuffix}`,
      );
    }
  }

  if (callChainFn !== undefined && packageSrcPath !== undefined) {
    const widgetFile = String(node.filePath);
    const widgetChainLines = callChainFn({
      sourceFile: widgetFile,
      packageSrcPath,
      renderingFilePath: widgetFile,
      baseIndent: chainBaseIndent,
    });
    for (const cl of widgetChainLines) {
      lines.push(cl);
    }
  }

  const grandChildPrefix = childIndentStr;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child === undefined) continue;
    const childIsLast = i === node.children.length - 1;
    const baseChildArgs = {
      node: child,
      prefix: grandChildPrefix,
      isLast: childIsLast,
      httpEdges,
      wsEdges,
      packageRoot,
      projectRoot,
    };
    const passthroughArgs =
      callChainFn === undefined || packageSrcPath === undefined
        ? {}
        : { packageSrcPath, callChainFn };
    lines.push(
      ...architectureWidgetNodeRenderBroker({
        ...baseChildArgs,
        ...passthroughArgs,
      }),
    );
  }

  return lines;
};
