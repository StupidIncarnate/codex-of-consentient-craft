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
  FlowNodeId,
  QuestContractEntry,
} from '@dungeonmaster/shared/contracts';

import { elkLayoutAdapter } from '../../adapters/elk/layout/elk-layout-adapter';
import { xyflowEdgeAdapter } from '../../adapters/xyflow/edge/xyflow-edge-adapter';
import { xyflowReactFlowAdapter } from '../../adapters/xyflow/react-flow/xyflow-react-flow-adapter';
import { contractCountContract } from '../../contracts/contract-count/contract-count-contract';
import type { ElkPositionMap } from '../../contracts/elk-position-map/elk-position-map-contract';
import { flowObservableNodeDataContract } from '../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import { reactFlowNodeDataContract } from '../../contracts/react-flow-node-data/react-flow-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { flowHandleStatics } from '../../statics/flow-handle/flow-handle-statics';
import { FlowNodeCardLayerWidget } from './flow-node-card-layer-widget';
import { FlowNodeDetailPanelLayerWidget } from './flow-node-detail-panel-layer-widget';
import { FlowObservableNodeLayerWidget } from './flow-observable-node-layer-widget';

export interface ReactFlowDiagramWidgetProps {
  flow: Flow;
  contracts?: readonly QuestContractEntry[];
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
}: ReactFlowDiagramWidgetProps): React.JSX.Element | null => {
  const [positions, setPositions] = useState<ElkPositionMap | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<FlowNodeId | null>(null);
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

    elkLayoutAdapter({ nodes: flow.nodes, edges: flow.edges })
      .then((pos) => {
        setPositions(pos);
      })
      .catch(() => {
        setError(true);
      });
  }, [flow]);

  const handleKeydown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setSelectedNodeId(null);
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

  const flowNodes = flow.nodes.map((n) => ({
    id: String(n.id),
    type: n.type,
    position: positions[String(n.id)] ?? { x: 0, y: 0 },
    selected: n.id === selectedNodeId,
    data: reactFlowNodeDataContract.parse({
      nodeId: n.id,
      label: n.label,
      nodeType: n.type,
      // Badge counts the contracts anchored to this node — the same nodeId match the detail panel
      // uses. Contract arrays are small, so a per-node filter is fine.
      contractCount: contractCountContract.parse(
        contracts.filter((c) => String(c.nodeId) === String(n.id)).length,
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
          observableId: obs.id,
          outcomeType: obs.type,
          description: obs.description,
        }),
      };
    });
  });

  const nodes = [...flowNodes, ...observableNodes];

  const flowEdges = flow.edges.map((e) => {
    // type 'flow' selects the custom edge (xyflowEdgeAdapter) which renders the FULL label as a
    // wrapping box. `data.label` is what the custom edge reads; the top-level `label` is kept
    // only so the jsdom test mock (which renders FLOW_EDGE_LABEL from `edge.label`) still works.
    const base = { id: String(e.id), source: String(e.from), target: String(e.to), type: 'flow' };
    if (e.label === undefined) {
      return base;
    }
    return { ...base, label: e.label, data: { label: e.label } };
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

  const selectedNode: FlowNode | undefined = selectedNodeId
    ? flow.nodes.find((n) => String(n.id) === String(selectedNodeId))
    : undefined;

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
            // instance does not re-fit when its container resizes, so it would leave the graph
            // top-anchored in the taller viewport; a fresh mount runs fitView against the new
            // size and centers the graph.
            key: expanded ? 'rf-expanded' : 'rf-collapsed',
            nodes,
            edges,
            nodeTypes: NODE_TYPES,
            edgeTypes: EDGE_TYPES,
            onNodeClick: (node: (typeof nodes)[0]) => {
              // Resolve the clicked node by its id against the flow nodes only — clicking an
              // assertion (observable) node finds nothing and leaves the selection unchanged.
              const clicked = flow.nodes.find((fn) => String(fn.id) === node.id);
              if (clicked !== undefined) {
                setSelectedNodeId(clicked.id);
              }
            },
            onPaneClick: () => {
              setSelectedNodeId(null);
            },
          },
        )}
      </div>

      {selectedNode === undefined ? null : (
        <FlowNodeDetailPanelLayerWidget
          node={selectedNode}
          contracts={contracts}
          onClose={() => {
            setSelectedNodeId(null);
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
