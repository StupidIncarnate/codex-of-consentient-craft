/**
 * PURPOSE: Renders a flow's node graph as depth-first text with back-references, cross-flow markers,
 * per-track sign-off verdicts and observable provenance
 *
 * USAGE:
 * flowGraphToTextTransformer({flow: FlowStub({nodes: [...], edges: [...]})});
 * // Returns: ContentText[] with indented flow graph lines
 *
 * SIGN-OFFS RENDER HERE OR AN AGENT NEVER SEES THEM. `format: 'text'` is the default every
 * get-quest returns, so a verdict that lives only in the JSON is invisible to the roles whose
 * prompts tell them to read their own track. Each of the three render sites — the node line, the
 * observable line, the edge lines — appends `signoffMarkersToTextTransformer`, which is '' when a
 * unit carries no sign-off. A flow with none therefore renders exactly as it does without the
 * feature: no markers, no blank columns.
 *
 * PROVENANCE RENDERS ON THE OBSERVABLE LINE, and only when `addedBy` is not `spec`. A spec
 * observable was in the flow at approval, which is the absence of news; a `+siegemaster` prefix says
 * this expectation was written in mid-quest, which changes what the reader is looking at.
 *
 * THE OFF-MAP LINE IS LAST AND CONDITIONAL. The seven probe families are not in the graph, so their
 * sign-offs have nowhere else to hang; only the families that actually carry one are printed,
 * because listing seven unsigned families per flow would cost more of the tool-result budget than
 * the whole graph above it.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { Flow } from '../../contracts/flow/flow-contract';
import type { FlowNodeId } from '../../contracts/flow-node-id/flow-node-id-contract';
import { flowNodeIdContract } from '../../contracts/flow-node-id/flow-node-id-contract';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { signoffMarkersToTextTransformer } from '../signoff-markers-to-text/signoff-markers-to-text-transformer';

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
      const nodeSignoffMarker = signoffMarkersToTextTransformer({
        flowriderSignoff: node.flowriderSignoff,
        siegemasterSignoff: node.siegemasterSignoff,
      });
      lines.push(
        contentTextContract.parse(
          `${indent}[#${nodeId}] ${node.label} (${node.type})${mergeMarker}${String(nodeSignoffMarker)}`,
        ),
      );

      for (const obs of node.observables) {
        const originMarker =
          obs.addedBy === 'spec' ? '' : ` ${SYM.observableOriginPrefix}${obs.addedBy}`;
        const obsSignoffMarker = signoffMarkersToTextTransformer({
          flowriderSignoff: obs.flowriderSignoff,
          siegemasterSignoff: obs.siegemasterSignoff,
        });
        lines.push(
          contentTextContract.parse(
            `${indent}${SYM.indent}> #${obs.id}: ${obs.description} [${obs.type}]${originMarker}${String(obsSignoffMarker)}`,
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
        const edgeSignoffMarker = String(
          signoffMarkersToTextTransformer({
            flowriderSignoff: edge.flowriderSignoff,
            siegemasterSignoff: edge.siegemasterSignoff,
          }),
        );

        if (!toIdParsed.success) {
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow} ${edgeToStr} ${SYM.crossFlow}${edgeSignoffMarker}`,
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
              `${indent}${SYM.indent}${SYM.rightArrow} ${edgeToStr} ${SYM.crossFlow}${edgeSignoffMarker}`,
            ),
          );
        } else if (isBackRef) {
          const labelPart = edge.label ? `"${String(edge.label)}" ` : '';
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart} [#${edgeToStr}] ${SYM.backRef}${edgeSignoffMarker}`,
            ),
          );
        } else {
          const labelPart = edge.label ? `"${String(edge.label)}" ` : '';
          lines.push(
            contentTextContract.parse(
              `${indent}${SYM.indent}${SYM.rightArrow}${labelPart}[#${String(toId)}]${edgeSignoffMarker}`,
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

  const offMapParts = flow.offMapSignoffs
    .map((family) => ({
      id: family.id,
      marker: String(
        signoffMarkersToTextTransformer({
          flowriderSignoff: family.flowriderSignoff,
          siegemasterSignoff: family.siegemasterSignoff,
        }),
      ),
    }))
    .filter((family) => family.marker.length > 0)
    .map((family) => `${family.id}${family.marker}`);

  if (offMapParts.length > 0) {
    lines.push(contentTextContract.parse(`${SYM.offMapLabel} ${offMapParts.join(' | ')}`));
  }

  return lines;
};
