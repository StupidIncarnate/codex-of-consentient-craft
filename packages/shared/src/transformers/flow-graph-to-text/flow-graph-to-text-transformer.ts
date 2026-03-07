/**
 * PURPOSE: Renders a flow's node graph as depth-first text with back-references and cross-flow markers
 *
 * USAGE:
 * flowGraphToTextTransformer({flow: FlowStub({nodes: [...], edges: [...]})});
 * // Returns: ContentText[] with indented flow graph lines
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Flow } from '../../contracts/flow/flow-contract';
import type { FlowNodeId } from '../../contracts/flow-node-id/flow-node-id-contract';
import { flowNodeIdContract } from '../../contracts/flow-node-id/flow-node-id-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';

const SYM = textDisplaySymbolsStatics;
const INITIAL_DEPTH = 0;
const DEPTH_INCREMENT = 1;

export const flowGraphToTextTransformer = ({ flow }: { flow: Flow }): ContentText[] => {
  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n] as const));
  const outgoingEdges = new Map(
    flow.nodes.map(
      (n) => [n.id, flow.edges.filter((e) => String(e.from) === String(n.id))] as const,
    ),
  );
  const incomingCounts = new Map(
    flow.nodes.map(
      (n) => [n.id, flow.edges.filter((e) => String(e.to) === String(n.id)).length] as const,
    ),
  );

  const visited = new Set<FlowNodeId>();
  const lines: ContentText[] = [];

  const entryNodeIdResult = flowNodeIdContract.safeParse(flow.entryPoint);
  const entryNodeId = entryNodeIdResult.success ? entryNodeIdResult.data : undefined;

  const orderedNodeIds = [
    ...(entryNodeId && nodeMap.has(entryNodeId) ? [entryNodeId] : []),
    ...flow.nodes.map((n) => n.id).filter((nid) => nid !== entryNodeId),
  ];

  for (const startNodeId of orderedNodeIds) {
    if (visited.has(startNodeId)) {
      continue;
    }

    const recursionStack = [{ nodeId: startNodeId, depth: INITIAL_DEPTH }];

    while (recursionStack.length > 0) {
      const current = recursionStack.pop();
      if (!current) {
        break;
      }
      const { nodeId, depth } = current;
      const indent = SYM.indent.repeat(depth);
      const node = nodeMap.get(nodeId);

      if (!node) {
        lines.push(
          contentTextContract.parse(
            `${indent}${SYM.rightArrow} ${String(nodeId)} ${SYM.crossFlow}`,
          ),
        );
        continue;
      }

      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);

      const isMerge = (incomingCounts.get(nodeId) ?? 0) > 1;
      const mergeMarker = isMerge ? ` ${SYM.merge}` : '';
      lines.push(
        contentTextContract.parse(
          `${indent}[#${nodeId}] ${node.label} (${node.type})${mergeMarker}`,
        ),
      );

      for (const obs of node.observables) {
        lines.push(
          contentTextContract.parse(
            `${indent}${SYM.indent}> #${obs.id}: ${obs.description} [${obs.type}]`,
          ),
        );
      }

      const edges = outgoingEdges.get(nodeId) ?? [];
      if (edges.length === 0) {
        lines.push(contentTextContract.parse(`${indent}${SYM.indent}${SYM.terminal}`));
        continue;
      }

      const childrenToVisit: typeof recursionStack = [];

      for (const edge of edges) {
        const toIdParsed = flowNodeIdContract.safeParse(edge.to);
        const edgeToStr = String(edge.to);

        if (!toIdParsed.success) {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow} ${edgeToStr} ${SYM.crossFlow}`,
            ),
          );
          continue;
        }

        const toId = toIdParsed.data;
        const targetNode = nodeMap.get(toId);
        const isBackRef = visited.has(toId);
        const isCrossFlow = !targetNode && !isBackRef;

        if (isCrossFlow) {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow} ${edgeToStr} ${SYM.crossFlow}`,
            ),
          );
        } else if (isBackRef) {
          const labelPart = edge.label ? `"${String(edge.label)}" ` : '';
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart} [#${edgeToStr}] ${SYM.backRef}`,
            ),
          );
        } else {
          const labelPart = edge.label ? `"${String(edge.label)}" ` : '';
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]`,
            ),
          );
          childrenToVisit.push({ nodeId: toId, depth: depth + DEPTH_INCREMENT });
        }
      }

      for (const child of childrenToVisit.reverse()) {
        recursionStack.push(child);
      }
    }
  }

  return lines;
};
