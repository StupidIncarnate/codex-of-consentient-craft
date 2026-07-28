/**
 * PURPOSE: Renders an interactive React Flow diagram for a quest flow with node selection,
 * detail panel, zoom/fullscreen controls, and ELK auto-layout.
 *
 * USAGE:
 * <ReactFlowDiagramWidget flow={flow} contracts={contracts} />
 * // Renders the flow graph with node cards, edges, detail panel, and controls
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ActionIcon, Group } from '@mantine/core';
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconFocusCentered,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';

import type {
  Flow,
  FlowNode,
  FlowObservable,
  QuestComment,
  QuestContractEntry,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { elkLayoutAdapter } from '../../adapters/elk/layout/elk-layout-adapter';
import { xyflowEdgeAdapter } from '../../adapters/xyflow/edge/xyflow-edge-adapter';
import { xyflowReactFlowAdapter } from '../../adapters/xyflow/react-flow/xyflow-react-flow-adapter';
import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentCountContract } from '../../contracts/comment-count/comment-count-contract';
import { contractCountContract } from '../../contracts/contract-count/contract-count-contract';
import type { ElkPositionMap } from '../../contracts/elk-position-map/elk-position-map-contract';
import type { FlowEdgeRouteMap } from '../../contracts/flow-edge-route-map/flow-edge-route-map-contract';
import { flowObservableNodeDataContract } from '../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import { reactFlowNodeDataContract } from '../../contracts/react-flow-node-data/react-flow-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { flowHandleStatics } from '../../statics/flow-handle/flow-handle-statics';
import { boxCommentsTransformer } from '../../transformers/box-comments/box-comments-transformer';
import { flowCrossFlowPortalsTransformer } from '../../transformers/flow-cross-flow-portals/flow-cross-flow-portals-transformer';
import { FlowNodeCardLayerWidget } from './flow-node-card-layer-widget';
import { FlowNodeDetailPanelLayerWidget } from './flow-node-detail-panel-layer-widget';
import { FlowObservableNodeLayerWidget } from './flow-observable-node-layer-widget';
import { FlowPortalNodeLayerWidget } from './flow-portal-node-layer-widget';

export interface ReactFlowDiagramWidgetProps {
  flow: Flow;
  contracts?: readonly QuestContractEntry[];
  /**
   * Set only when the comment compose controls are allowed for this quest. Presence is the gate:
   * when it is absent every card renders without a comment button.
   */
  commentQuestId?: QuestId;
  /**
   * Every persisted comment on the quest, across all flows. Gated INDEPENDENTLY of commentQuestId:
   * the count badge and the detail panel's comment list render in every quest status, including the
   * approved and session-less ones where composing is disallowed, because that is exactly when the
   * review this record captures is most worth reading.
   */
  comments?: readonly QuestComment[];
}

const MAX_HEIGHT = 800;
const EXPANDED_HEIGHT = 'calc(100vh - 160px)';
const ICON_SIZE = 20;

const NODE_TYPES = {
  state: FlowNodeCardLayerWidget as React.ComponentType<never>,
  decision: FlowNodeCardLayerWidget as React.ComponentType<never>,
  action: FlowNodeCardLayerWidget as React.ComponentType<never>,
  terminal: FlowNodeCardLayerWidget as React.ComponentType<never>,
  // Assertion (observable) cards that branch off to the right of each flow node.
  observable: FlowObservableNodeLayerWidget as React.ComponentType<never>,
  // Portal stand-ins for edges that cross into another flow (a `flowId:nodeId` reference).
  portal: FlowPortalNodeLayerWidget as React.ComponentType<never>,
};

// Single custom edge type: renders the full branch label as a wrapping HTML box (see
// xyflowEdgeAdapter) instead of React Flow's truncation-prone single-line SVG label.
const EDGE_TYPES = {
  flow: xyflowEdgeAdapter as React.ComponentType<never>,
};

const { colors } = emberDepthsThemeStatics;

const controlStyles = {
  bg: colors['bg-raised'],
  border: `1px solid ${colors.border}`,
};

export const ReactFlowDiagramWidget = ({
  flow,
  contracts = [],
  commentQuestId,
  comments = [],
}: ReactFlowDiagramWidgetProps): React.JSX.Element | null => {
  const [positions, setPositions] = useState<ElkPositionMap | null>(null);
  const [routes, setRoutes] = useState<FlowEdgeRouteMap | null>(null);
  const [error, setError] = useState<boolean>(false);
  // One selection for both kinds of clickable box. An anchor without an observableId is the node
  // card itself; one with an observableId is an assertion card branching off it. Keeping both in a
  // single value is what makes them mutually exclusive by construction, so the detail panel can
  // never open for a node and an assertion at once.
  const [selectedAnchor, setSelectedAnchor] = useState<CommentAnchor | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const hasRun = useRef(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  const clickNativeControl = useCallback((controlClass: string): void => {
    diagramRef.current?.querySelector<HTMLButtonElement>(`.${controlClass}`)?.click();
  }, []);

  useEffect(() => {
    if (flow.nodes.length === 0) return;
    if (hasRun.current) return;
    hasRun.current = true;

    // Portals stand in for edges whose endpoint lives in another flow — ELK needs them as graph
    // children or it throws on the unresolvable endpoint.
    const portals = flowCrossFlowPortalsTransformer({ nodes: flow.nodes, edges: flow.edges });
    elkLayoutAdapter({ nodes: flow.nodes, edges: flow.edges, portals })
      .then((layout) => {
        setPositions(layout.positions);
        setRoutes(layout.routes);
      })
      .catch(() => {
        setError(true);
      });
  }, [flow]);

  const handleKeydown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setSelectedAnchor(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [handleKeydown]);

  if (flow.nodes.length === 0) {
    return null;
  }

  if (error) {
    return (
      <div
        data-testid="FLOW_DIAGRAM_ERROR"
        style={{ color: colors.danger, fontFamily: 'monospace', fontSize: 12 }}
      >
        Could not render flow diagram
      </div>
    );
  }

  if (positions === null) {
    return null;
  }

  // Anchor context for the comment affordance. Spread into each card's data only when composing is
  // allowed, so the cards themselves need no separate visibility flag to check.
  const commentAnchorData =
    commentQuestId === undefined ? {} : { questId: commentQuestId, flowId: flow.id };

  // The node card is the selected box only when the selection names no observable — an assertion
  // card's selection leaves its parent card unringed, because the panel is showing the assertion.
  const selectedCardNodeId =
    selectedAnchor !== null && selectedAnchor.observableId === undefined
      ? selectedAnchor.nodeId
      : undefined;

  const flowNodes = flow.nodes.map((n) => ({
    id: String(n.id),
    type: n.type,
    position: positions[String(n.id)] ?? { x: 0, y: 0 },
    selected: selectedCardNodeId !== undefined && String(selectedCardNodeId) === String(n.id),
    data: reactFlowNodeDataContract.parse({
      ...commentAnchorData,
      nodeId: n.id,
      label: n.label,
      nodeType: n.type,
      // Badge counts the contracts anchored to this node — the same nodeId match the detail panel
      // uses. Contract arrays are small, so a per-node filter is fine.
      contractCount: contractCountContract.parse(
        contracts.filter((c) => String(c.nodeId) === String(n.id)).length,
      ),
      // Only the comments anchored to the node ITSELF — the ones on its assertion cards belong to
      // those cards' own badges, so the badge here always agrees with the list the panel shows.
      commentCount: commentCountContract.parse(
        boxCommentsTransformer({ comments, flowId: flow.id, nodeId: n.id }).length,
      ),
    }),
  }));

  // Each observable becomes its own card stacked into a column to the RIGHT of its flow node, so a
  // reviewer reads every assertion on the canvas. Positions are computed relative to the flow
  // node's ELK position; ELK reserves each node enough height to clear its whole column.
  const observableNodes = flow.nodes.flatMap((n) => {
    const base = positions[String(n.id)] ?? { x: 0, y: 0 };
    const { observable } = elkLayoutStatics;
    const columnX = base.x + elkLayoutStatics.node.width + observable.gap;
    let cursorY = 0;
    return n.observables.map((obs) => {
      const obsLines = Math.max(
        1,
        Math.ceil(String(obs.description).length / observable.labelEstimate.charsPerLine),
      );
      const obsCardHeight =
        observable.labelEstimate.chromeHeight +
        obsLines * observable.labelEstimate.lineHeight +
        observable.labelEstimate.buffer;
      const y = base.y + cursorY;
      cursorY += obsCardHeight + observable.rowGap;
      return {
        id: `obs:${String(n.id)}:${String(obs.id)}`,
        type: 'observable',
        position: { x: columnX, y },
        data: flowObservableNodeDataContract.parse({
          ...commentAnchorData,
          observableId: obs.id,
          // The parent node, so an observable comment stays findable from the node it branches off.
          nodeId: n.id,
          outcomeType: obs.type,
          description: obs.description,
          commentCount: commentCountContract.parse(
            boxCommentsTransformer({
              comments,
              flowId: flow.id,
              nodeId: n.id,
              observableId: obs.id,
            }).length,
          ),
        }),
      };
    });
  });

  // Portal stand-ins for edges that hand off to a node in another flow. Their id is the raw
  // `flowId:nodeId` reference so the cross-flow edge (source/target = String(e.to)) resolves to
  // this node instead of dangling. Clicking one is a no-op — onNodeClick only matches flow.nodes.
  const portals = flowCrossFlowPortalsTransformer({ nodes: flow.nodes, edges: flow.edges });
  const portalNodes = portals.map((portal) => ({
    id: String(portal.reference),
    type: 'portal',
    position: positions[String(portal.reference)] ?? { x: 0, y: 0 },
    data: portal,
  }));

  const nodes = [...flowNodes, ...observableNodes, ...portalNodes];

  const flowEdges = flow.edges.map((e) => {
    // type 'flow' selects the custom edge (xyflowEdgeAdapter). `data.route` is the ELK-computed
    // path the edge draws itself along (routed clear of the cards); `data.label` is the wrapping
    // label box. The top-level `label` is kept only so the jsdom test mock (which renders
    // FLOW_EDGE_LABEL from `edge.label`) still works.
    const id = String(e.id);
    const route = routes?.[id];
    const routeData = route === undefined ? {} : { route };
    // A back-edge (target laid out ABOVE the source) is a loop; attach it to the side loop handles
    // so it exits/re-enters from the RIGHT of the cards instead of the top/bottom.
    const isLoop = (positions[String(e.to)]?.y ?? 0) < (positions[String(e.from)]?.y ?? 0);
    const loopHandles = isLoop
      ? {
          sourceHandle: flowHandleStatics.loopSourceId,
          targetHandle: flowHandleStatics.loopTargetId,
        }
      : {};
    const base = { id, source: String(e.from), target: String(e.to), type: 'flow', ...loopHandles };
    if (e.label === undefined) {
      return { ...base, data: routeData };
    }
    return { ...base, label: e.label, data: { label: e.label, ...routeData } };
  });

  // Connector edges attach from the flow card's RIGHT source handle to each assertion card, so the
  // column reads as branching off that node. No label, so the jsdom mock (label-only) skips them.
  const observableEdges = flow.nodes.flatMap((n) =>
    n.observables.map((obs) => ({
      id: `obs-edge:${String(n.id)}:${String(obs.id)}`,
      source: String(n.id),
      sourceHandle: flowHandleStatics.observableSourceId,
      target: `obs:${String(n.id)}:${String(obs.id)}`,
    })),
  );

  const edges = [...flowEdges, ...observableEdges];

  // Resolve the selection against the LIVE flow every render, so a selected box that disappears
  // from the spec (an agent turn deleting a node) closes its panel instead of stranding it.
  const selectedNode: FlowNode | undefined =
    selectedAnchor === null
      ? undefined
      : flow.nodes.find((n) => String(n.id) === String(selectedAnchor.nodeId));

  const selectedObservable: FlowObservable | undefined =
    selectedAnchor?.observableId === undefined
      ? undefined
      : selectedNode?.observables.find(
          (obs) => String(obs.id) === String(selectedAnchor.observableId),
        );

  // An assertion selection whose observable no longer resolves opens nothing, rather than falling
  // back to its parent node's panel — that fallback would silently show another box's comments.
  const panelNode: FlowNode | undefined =
    selectedAnchor?.observableId !== undefined && selectedObservable === undefined
      ? undefined
      : selectedNode;

  const selectedBoxComments =
    selectedAnchor === null || panelNode === undefined
      ? []
      : boxCommentsTransformer({
          comments,
          flowId: flow.id,
          nodeId: panelNode.id,
          ...(selectedAnchor.observableId === undefined
            ? {}
            : { observableId: selectedAnchor.observableId }),
        });

  return (
    <div
      ref={diagramRef}
      data-testid="FLOW_DIAGRAM"
      style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}
    >
      <div
        data-testid="FLOW_DIAGRAM_CANVAS_WRAPPER"
        style={{
          flex: 1,
          // React Flow's canvas is height:100%, which resolves against the parent's `height`
          // (NOT minHeight). The wrapper must therefore pin a DEFINITE height in BOTH states —
          // a minHeight-only expanded wrapper leaves `height` auto, so the canvas collapses to
          // 0px and the diagram renders as an empty (black) panel. Collapsed pins MAX_HEIGHT;
          // expanded pins a near-viewport definite height.
          height: expanded ? EXPANDED_HEIGHT : MAX_HEIGHT,
          overflow: 'hidden',
        }}
      >
        {React.createElement(
          xyflowReactFlowAdapter as unknown as React.ComponentType<Record<PropertyKey, unknown>>,
          {
            // Remount React Flow when the canvas size changes (collapse <-> expand). A live
            // instance does not re-frame when its container resizes, so it would keep the old
            // framing in the resized viewport; a fresh mount re-frames against the new size.
            key: expanded ? 'rf-expanded' : 'rf-collapsed',
            nodes,
            edges,
            nodeTypes: NODE_TYPES,
            edgeTypes: EDGE_TYPES,
            // Collapsed: top-anchor so switching flow tabs starts the reader at the entry node,
            // zoomed-in. Fullscreen: fit the whole graph as an overview.
            topAlign: !expanded,
            onNodeClick: (node: (typeof nodes)[0]) => {
              // A flow card resolves by id. An assertion card does not — its React Flow id is a
              // composite (`obs:node:observable`), so its anchor is read off the node DATA, which
              // is the only place both ids survive independently of that string's shape.
              const clicked = flow.nodes.find((fn) => String(fn.id) === node.id);
              if (clicked !== undefined) {
                setSelectedAnchor({ flowId: flow.id, nodeId: clicked.id });
                return;
              }
              const observableData = flowObservableNodeDataContract.safeParse(node.data);
              // Neither a flow card nor an assertion card — a portal stand-in. Clicking one is a
              // no-op: it renders a node that lives in ANOTHER flow, so it has no box of its own.
              if (!observableData.success) {
                return;
              }
              setSelectedAnchor({
                flowId: flow.id,
                nodeId: observableData.data.nodeId,
                observableId: observableData.data.observableId,
              });
            },
            onPaneClick: () => {
              setSelectedAnchor(null);
            },
          },
        )}
      </div>

      {panelNode === undefined ? null : (
        <FlowNodeDetailPanelLayerWidget
          node={panelNode}
          contracts={contracts}
          comments={selectedBoxComments}
          {...(selectedObservable === undefined ? {} : { observable: selectedObservable })}
          onClose={() => {
            setSelectedAnchor(null);
          }}
        />
      )}

      <Group
        gap={8}
        justify="center"
        mt={8}
        style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 10 }}
      >
        <ActionIcon
          variant="filled"
          size={32}
          data-testid="ZOOM_IN_BUTTON"
          onClick={() => {
            clickNativeControl('react-flow__controls-zoomin');
          }}
          style={{ background: controlStyles.bg, border: controlStyles.border }}
        >
          <IconZoomIn size={ICON_SIZE} />
        </ActionIcon>
        <ActionIcon
          variant="filled"
          size={32}
          data-testid="ZOOM_OUT_BUTTON"
          onClick={() => {
            clickNativeControl('react-flow__controls-zoomout');
          }}
          style={{ background: controlStyles.bg, border: controlStyles.border }}
        >
          <IconZoomOut size={ICON_SIZE} />
        </ActionIcon>
        <ActionIcon
          variant="filled"
          size={32}
          data-testid="FIT_VIEW_BUTTON"
          onClick={() => {
            clickNativeControl('react-flow__controls-fitview');
          }}
          style={{ background: controlStyles.bg, border: controlStyles.border }}
        >
          <IconFocusCentered size={ICON_SIZE} />
        </ActionIcon>
        <ActionIcon
          variant="filled"
          size={32}
          data-testid="FULLSCREEN_BUTTON"
          data-expanded={expanded}
          onClick={() => {
            setExpanded((prev) => !prev);
          }}
          style={{ background: controlStyles.bg, border: controlStyles.border }}
        >
          {expanded ? (
            <IconArrowsMinimize size={ICON_SIZE} />
          ) : (
            <IconArrowsMaximize size={ICON_SIZE} />
          )}
        </ActionIcon>
      </Group>
    </div>
  );
};
