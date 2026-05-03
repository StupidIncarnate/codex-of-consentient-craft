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

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import type { WidgetNode } from '../../../contracts/widget-node/widget-node-contract';
import type { HttpEdge } from '../../../contracts/http-edge/http-edge-contract';
import type { WsEdge } from '../../../contracts/ws-edge/ws-edge-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { projectMapHeadlineFrontendReactStatics } from '../../../statics/project-map-headline-frontend-react/project-map-headline-frontend-react-statics';
import { architectureBindingFlowTraceBroker } from '../binding-flow-trace/architecture-binding-flow-trace-broker';

export const architectureWidgetNodeRenderBroker = ({
  node,
  prefix,
  isLast,
  httpEdges,
  wsEdges,
  packageRoot,
  projectRoot,
}: {
  node: WidgetNode;
  prefix: ContentText;
  isLast: boolean;
  httpEdges: HttpEdge[];
  wsEdges: WsEdge[];
  packageRoot: AbsoluteFilePath;
  projectRoot: AbsoluteFilePath;
}): ContentText[] => {
  const { pipe, branch, last, indent } = projectMapHeadlineFrontendReactStatics.treeConnectors;
  const { bindingFlowLineSubIndent, httpMethodPadWidth } = projectMapHeadlineFrontendReactStatics;
  const connector = isLast ? last : branch;
  const lines: ContentText[] = [];

  lines.push(contentTextContract.parse(`${String(prefix)}${connector} ${String(node.widgetName)}`));

  const childIndentStr = isLast ? `${String(prefix)}${indent}` : `${String(prefix)}${pipe}  `;
  const flowIndent = `${childIndentStr}${bindingFlowLineSubIndent}`;

  for (const bindingName of node.bindingsAttached) {
    lines.push(contentTextContract.parse(`${childIndentStr}bindings: ${String(bindingName)}`));

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
        contentTextContract.parse(
          `${flowIndent}→ ${method} ${String(flow.urlPattern)}${flowSuffix}`,
        ),
      );
    }

    for (const ws of wsEvents) {
      const emitterSuffix = ws.emitterRef === null ? '' : `  ←─ ${String(ws.emitterRef)}`;
      lines.push(
        contentTextContract.parse(`${flowIndent}ws← ${String(ws.eventType)}${emitterSuffix}`),
      );
    }
  }

  const grandChildPrefix = contentTextContract.parse(childIndentStr);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child === undefined) continue;
    const childIsLast = i === node.children.length - 1;
    lines.push(
      ...architectureWidgetNodeRenderBroker({
        node: child,
        prefix: grandChildPrefix,
        isLast: childIsLast,
        httpEdges,
        wsEdges,
        packageRoot,
        projectRoot,
      }),
    );
  }

  return lines;
};
