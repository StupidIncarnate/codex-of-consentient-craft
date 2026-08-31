/**
 * PURPOSE: The quest flow as a browsable graph — ELK lays it out, React Flow paints it, and the
 * cards carry the comment and detail affordances a reviewer works through. Safe to leave mounted
 * while an agent rewrites the spec underneath it: every edit re-lays out and swaps in whole, so the
 * canvas never paints a half-positioned graph. Sized entirely BY its container: it pins no height
 * of its own, so mount it only inside a parent that resolves a definite one (see the height chain
 * in packages/web/CLAUDE.md) or the canvas paints at 0px.
 *
 * USAGE:
 * <ReactFlowDiagramWidget flow={flow} contracts={contracts} />
 * // Renders the flow graph with node cards, edges, detail panel, and controls
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Group } from '@mantine/core';
import { IconFocusCentered, IconZoomIn, IconZoomOut } from '@tabler/icons-react';

import type {
  Flow,
  FlowNode,
  FlowNodeId,
  FlowObservable,
  ObservableId,
  PackageName,
  PackageType,
  QuestComment,
  QuestContractEntry,
  QuestId,
  QuestPackageEntry,
} from '@dungeonmaster/shared/contracts';

import { elkLayoutAdapter } from '../../adapters/elk/layout/elk-layout-adapter';
import { xyflowEdgeAdapter } from '../../adapters/xyflow/edge/xyflow-edge-adapter';
import { xyflowReactFlowAdapter } from '../../adapters/xyflow/react-flow/xyflow-react-flow-adapter';
import type { CommentAnchor } from '../../contracts/comment-anchor/comment-anchor-contract';
import { commentCountContract } from '../../contracts/comment-count/comment-count-contract';
import type { CommentCount } from '../../contracts/comment-count/comment-count-contract';
import { contractCountContract } from '../../contracts/contract-count/contract-count-contract';
import type { ElkPositionMap } from '../../contracts/elk-position-map/elk-position-map-contract';
import type { FlowEdgeRouteMap } from '../../contracts/flow-edge-route-map/flow-edge-route-map-contract';
import { flowLayoutSignatureContract } from '../../contracts/flow-layout-signature/flow-layout-signature-contract';
import type { FlowLayoutSignature } from '../../contracts/flow-layout-signature/flow-layout-signature-contract';
import { flowObservableNodeDataContract } from '../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { iconButtonSizeContract } from '../../contracts/icon-button-size/icon-button-size-contract';
import { reactFlowNodeDataContract } from '../../contracts/react-flow-node-data/react-flow-node-data-contract';
import { testIdContract } from '../../contracts/test-id/test-id-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { flowHandleStatics } from '../../statics/flow-handle/flow-handle-statics';
import { flowNodeStyleStatics } from '../../statics/flow-node-style/flow-node-style-statics';
import { iconButtonStatics } from '../../statics/icon-button/icon-button-statics';
import { boxCommentsTransformer } from '../../transformers/box-comments/box-comments-transformer';
import { flowCrossFlowPortalsTransformer } from '../../transformers/flow-cross-flow-portals/flow-cross-flow-portals-transformer';
import { IconButtonWidget } from '../icon-button/icon-button-widget';
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
  /**
   * The quest's own declared packages — the ONLY source for a tag's kind. Names are resolved
   * against this list rather than recognised, because the same spec runs in repos whose packages
   * this app has never seen and a repo may hold several UI packages. A tag with no entry here is
   * painted unresolved, which is the coverage rule's failure case rather than a colour to guess at.
   */
  packagesAffected?: readonly QuestPackageEntry[];
}

// The floor under "fill the container". A short window leaves the spec panel very little after the
// title bar, tabs, pinned request and flow metadata — squeezed to that, the canvas shows one row of
// cards and everything below it is clipped out of reach. Below this the diagram stops shrinking and
// the SPEC tab scrolls instead, which is the same trade a reader would make by hand.
const MIN_CANVAS_HEIGHT = 420;
// The canvas controls are the one place in the app that takes the large size — they float over the
// diagram rather than sitting inside a row of text, so they are sized to be hit without aiming.
const CONTROL_SIZE = iconButtonSizeContract.parse(iconButtonStatics.sizes.large);
const ZOOM_IN_LABEL = buttonLabelContract.parse('Zoom in');
const ZOOM_IN_TEST_ID = testIdContract.parse('ZOOM_IN_BUTTON');
const ZOOM_OUT_LABEL = buttonLabelContract.parse('Zoom out');
const ZOOM_OUT_TEST_ID = testIdContract.parse('ZOOM_OUT_BUTTON');
const FIT_VIEW_LABEL = buttonLabelContract.parse('Fit diagram to view');
const FIT_VIEW_TEST_ID = testIdContract.parse('FIT_VIEW_BUTTON');

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

// The empty defaults live out here because `contracts = []` in the signature mints a FRESH array on
// every render the prop is omitted, and these two are dependencies of the node memo below — a new
// array each render is a changed dependency, which rebuilds the very node objects React Flow needs
// to stay identical to keep its measurement.
const NO_CONTRACTS: readonly QuestContractEntry[] = [];
const NO_COMMENTS: readonly QuestComment[] = [];
const NO_PACKAGES_AFFECTED: readonly QuestPackageEntry[] = [];

export const ReactFlowDiagramWidget = ({
  flow,
  contracts = NO_CONTRACTS,
  commentQuestId,
  comments = NO_COMMENTS,
  packagesAffected = NO_PACKAGES_AFFECTED,
}: ReactFlowDiagramWidgetProps): React.JSX.Element | null => {
  // The flow the canvas is painting, held apart from the `flow` PROP: it is the last one ELK
  // actually laid out, swapped in together with its positions and routes. An agent editing the spec
  // hands over new nodes and edges a frame before there is any layout for them, and rendering that
  // prop directly is what put every new card at {0,0} with its edges routed along the old graph's
  // bend points — the flicker of piled-up boxes and crossed lines mid-edit. Holding the snapshot
  // costs one ELK pass (single-digit ms) of staleness and never shows a half-laid-out graph.
  const [laidOutFlow, setLaidOutFlow] = useState<Flow | null>(null);
  const [positions, setPositions] = useState<ElkPositionMap | null>(null);
  const [routes, setRoutes] = useState<FlowEdgeRouteMap | null>(null);
  const [error, setError] = useState<boolean>(false);
  // One selection for both kinds of clickable box. An anchor without an observableId is the node
  // card itself; one with an observableId is an assertion card branching off it. Keeping both in a
  // single value is what makes them mutually exclusive by construction, so the detail panel can
  // never open for a node and an assertion at once.
  const [selectedAnchor, setSelectedAnchor] = useState<CommentAnchor | null>(null);
  // Content-identity of the flow the in-flight layout pass was started for. The `flow` PROP is a
  // fresh object on every quest refresh, so keying the pass on reference would re-run ELK several
  // times a second on a spec nobody touched.
  const laidOutSignature = useRef<FlowLayoutSignature | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const clickNativeControl = useCallback((controlClass: string): void => {
    diagramRef.current?.querySelector<HTMLButtonElement>(`.${controlClass}`)?.click();
  }, []);

  useEffect(() => {
    if (flow.nodes.length === 0) return;
    // The signature covers the WHOLE flow, not just the fields ELK reads, precisely because the
    // canvas paints the laid-out snapshot: an edit that did not bump this would never reach the
    // screen. ELK on a spec-sized graph is single-digit ms, so re-laying out for a renamed label
    // costs less than the bookkeeping to decide it did not need to.
    const signature = flowLayoutSignatureContract.parse(JSON.stringify(flow));
    if (laidOutSignature.current === signature) return;
    laidOutSignature.current = signature;

    // Portals stand in for edges whose endpoint lives in another flow — ELK needs them as graph
    // children or it throws on the unresolvable endpoint.
    const portals = flowCrossFlowPortalsTransformer({ nodes: flow.nodes, edges: flow.edges });
    elkLayoutAdapter({ nodes: flow.nodes, edges: flow.edges, portals })
      .then((layout) => {
        // A newer edit already started its own pass, so this result is for a flow the reviewer has
        // moved past. Dropping it is what stops a slow older layout landing on top of a newer one.
        if (laidOutSignature.current !== signature) return;
        // One batch: the flow, its positions and its routes always reach the canvas together, so
        // there is no render where a node has no position or an edge has no route.
        setLaidOutFlow(flow);
        setPositions(layout.positions);
        setRoutes(layout.routes);
        setError(false);
      })
      .catch((layoutError: unknown) => {
        globalThis.console.error('[react-flow-diagram]', layoutError);
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

  // The node card is the selected box only when the selection names no observable — an assertion
  // card's selection leaves its parent card unringed, because the panel is showing the assertion.
  const selectedCardNodeId =
    selectedAnchor !== null && selectedAnchor.observableId === undefined
      ? selectedAnchor.nodeId
      : undefined;

  // MEMOIZED, and that is load-bearing rather than an optimisation. React Flow keeps a node's
  // measurement only while the OBJECT it measured stays identical — `adoptUserNodes` discards
  // `internals`, and with it `handleBounds`, for any node object it has not seen before. A card
  // never changes size after it mounts, so its ResizeObserver fires exactly once; lose that one
  // measurement to a rebuild landing in the same frame and the node is unmeasured for the rest of
  // its life. The visible symptom is EVERY EDGE MISSING — an edge whose endpoints have no handle
  // bounds has nowhere to attach, so React Flow drops it silently — over a canvas of cards that all
  // look fine, which is why this reads as "the lines don't render" rather than as a measurement bug.
  // Rebuilding on every render loses that race whenever anything re-renders this widget in the
  // mount frame, and on a live quest the websocket delivering chat does exactly that.
  //
  // `initialWidth`/`initialHeight` is the OTHER half and does not replace this one: it stops React
  // Flow painting the card `visibility: hidden` while unmeasured, so the cards show either way. The
  // box is the SAME estimate `elkLayoutAdapter` laid the graph out with, so the pre-measurement size
  // matches the rectangle ELK reserved.
  const nodes = useMemo(() => {
    if (laidOutFlow === null || positions === null) {
      return [];
    }

    // Anchor context for the comment affordance. Spread into each card's data only when composing
    // is allowed, so the cards themselves need no separate visibility flag to check.
    const commentAnchorData =
      commentQuestId === undefined ? {} : { questId: commentQuestId, flowId: laidOutFlow.id };

    // `comments` spans the WHOLE quest across every flow (see the prop doc above), so scope down to
    // THIS flow and count per box in one pass here, rather than letting boxCommentsTransformer
    // re-scan the full array once per node AND once per observable below — that repeated full-array
    // filter, multiplied by every box the canvas draws, is exactly the nested-scan shape a Map
    // lookup replaces with a single O(comments) pass plus O(1) reads.
    const nodeCommentCounts = new Map<FlowNodeId, CommentCount>();
    const observableCommentCounts = new Map<FlowNodeId, Map<ObservableId, CommentCount>>();
    comments
      .filter((c) => c.flowId === laidOutFlow.id)
      .forEach((c) => {
        if (c.observableId === undefined) {
          const priorCount = nodeCommentCounts.get(c.nodeId);
          nodeCommentCounts.set(
            c.nodeId,
            commentCountContract.parse((priorCount === undefined ? 0 : Number(priorCount)) + 1),
          );
          return;
        }
        const perObservable =
          observableCommentCounts.get(c.nodeId) ?? new Map<ObservableId, CommentCount>();
        const priorCount = perObservable.get(c.observableId);
        perObservable.set(
          c.observableId,
          commentCountContract.parse((priorCount === undefined ? 0 : Number(priorCount)) + 1),
        );
        observableCommentCounts.set(c.nodeId, perObservable);
      });
    const zeroCommentCount = commentCountContract.parse(0);

    // A tag's KIND is only knowable from the quest's own declaration, so it is resolved here once
    // per layout rather than by each card. Nothing keys off the package NAME: this same diagram
    // renders quests from repos whose packages it has never seen, and a repo may hold several UI
    // packages that must all read alike.
    const packageTypeByName = new Map<PackageName, PackageType>(
      packagesAffected.map((entry) => [entry.name, entry.packageType]),
    );

    const flowNodes = laidOutFlow.nodes.map((n) => {
      const { labelEstimate } = elkLayoutStatics;
      const labelLines = Math.max(
        1,
        Math.ceil(String(n.label).length / labelEstimate.charsPerLine),
      );
      // The SAME package-row estimate elkLayoutAdapter reserved the box with, so the card React
      // Flow paints before its own measurement lands matches the rectangle ELK laid out for it.
      const packageChipChars = n.packages.reduce(
        (sum, packageName) =>
          sum + String(packageName).length + labelEstimate.packageRow.chipOverheadChars,
        0,
      );
      const packageLines = Math.max(
        1,
        Math.ceil(packageChipChars / labelEstimate.packageRow.charsPerLine),
      );
      const cardHeight =
        labelEstimate.chromeHeight +
        labelLines * labelEstimate.lineHeight +
        labelEstimate.badgeHeight +
        packageLines * labelEstimate.packageRow.lineHeight +
        labelEstimate.buffer;
      return {
        id: String(n.id),
        type: n.type,
        position: positions[String(n.id)] ?? { x: 0, y: 0 },
        initialWidth: elkLayoutStatics.node.width,
        initialHeight: cardHeight,
        selected: selectedCardNodeId !== undefined && String(selectedCardNodeId) === String(n.id),
        data: reactFlowNodeDataContract.parse({
          ...commentAnchorData,
          nodeId: n.id,
          label: n.label,
          nodeType: n.type,
          // One chip per tag, each carrying the kind resolved above. An unmatched name keeps its
          // chip and drops the kind, so the card paints it unresolved rather than silently omitting
          // a package the node claims to land in.
          packages: n.packages.map((packageName) => {
            const packageType = packageTypeByName.get(packageName);
            return {
              name: packageName,
              ...(packageType === undefined ? {} : { packageType }),
            };
          }),
          // Badge counts the contracts anchored to this node — the same nodeId match the detail
          // panel uses. Contract arrays are small, so a per-node filter is fine.
          contractCount: contractCountContract.parse(
            contracts.filter((c) => String(c.nodeId) === String(n.id)).length,
          ),
          // Only the comments anchored to the node ITSELF — the ones on its assertion cards belong
          // to those cards' own badges, so the badge here always agrees with the panel's list.
          commentCount: nodeCommentCounts.get(n.id) ?? zeroCommentCount,
        }),
      };
    });

    // Each observable becomes its own card stacked into a column to the RIGHT of its flow node, so
    // a reviewer reads every assertion on the canvas. Positions are computed relative to the flow
    // node's ELK position; ELK reserves each node enough height to clear its whole column.
    const observableNodes = laidOutFlow.nodes.flatMap((n) => {
      const base = positions[String(n.id)] ?? { x: 0, y: 0 };
      const { observable } = elkLayoutStatics;
      const columnX = base.x + elkLayoutStatics.node.width + observable.gap;
      let cursorY = 0;
      return n.observables.map((obs) => {
        const obsPackageType = packageTypeByName.get(obs.package);
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
          initialWidth: observable.width,
          initialHeight: obsCardHeight,
          data: flowObservableNodeDataContract.parse({
            ...commentAnchorData,
            observableId: obs.id,
            // The parent node, so an observable comment stays findable from the node it branches
            // off.
            nodeId: n.id,
            outcomeType: obs.type,
            description: obs.description,
            ...(obs.verifyByReading === true ? { verifyByReading: true } : {}),
            // The ONE side of the seam this criterion is read on. Resolved through the same map as
            // the parent card's chips, so a node and its assertions can never disagree about a
            // package's kind.
            package: {
              name: obs.package,
              ...(obsPackageType === undefined ? {} : { packageType: obsPackageType }),
            },
            commentCount: observableCommentCounts.get(n.id)?.get(obs.id) ?? zeroCommentCount,
          }),
        };
      });
    });

    // Portal stand-ins for edges that hand off to a node in another flow. Their id is the raw
    // `flowId:nodeId` reference so the cross-flow edge (source/target = String(e.to)) resolves to
    // this node instead of dangling. Clicking one is a no-op — onNodeClick only matches flow nodes.
    const portals = flowCrossFlowPortalsTransformer({
      nodes: laidOutFlow.nodes,
      edges: laidOutFlow.edges,
    });
    const portalNodes = portals.map((portal) => {
      const { labelEstimate } = elkLayoutStatics;
      const portalLines = Math.max(
        1,
        Math.ceil(String(portal.label).length / labelEstimate.charsPerLine),
      );
      return {
        id: String(portal.reference),
        type: 'portal',
        position: positions[String(portal.reference)] ?? { x: 0, y: 0 },
        initialWidth: elkLayoutStatics.node.width,
        initialHeight:
          labelEstimate.chromeHeight +
          portalLines * labelEstimate.lineHeight +
          labelEstimate.buffer,
        data: portal,
      };
    });

    return [...flowNodes, ...observableNodes, ...portalNodes];
  }, [
    laidOutFlow,
    positions,
    contracts,
    comments,
    commentQuestId,
    packagesAffected,
    selectedCardNodeId,
  ]);

  // Memoized for the same reason as `nodes`: a fresh edge array on every render re-adopts every
  // edge, and an edge re-adopted while its endpoints are still unmeasured is dropped.
  const edges = useMemo(() => {
    if (laidOutFlow === null || positions === null) {
      return [];
    }

    const flowEdges = laidOutFlow.edges.map((e) => {
      // type 'flow' selects the custom edge (xyflowEdgeAdapter). `data.route` is the ELK-computed
      // path the edge draws itself along (routed clear of the cards); `data.label` is the wrapping
      // label box. The top-level `label` is kept only so the jsdom test mock (which renders
      // FLOW_EDGE_LABEL from `edge.label`) still works.
      const id = String(e.id);
      const route = routes?.[id];
      const routeData = route === undefined ? {} : { route };
      // A back-edge (target laid out ABOVE the source) is a loop; attach it to the side loop
      // handles so it exits/re-enters from the RIGHT of the cards instead of the top/bottom.
      const isLoop = (positions[String(e.to)]?.y ?? 0) < (positions[String(e.from)]?.y ?? 0);
      const loopHandles = isLoop
        ? {
            sourceHandle: flowHandleStatics.loopSourceId,
            targetHandle: flowHandleStatics.loopTargetId,
          }
        : {};
      const base = {
        id,
        source: String(e.from),
        target: String(e.to),
        type: 'flow',
        ...loopHandles,
      };
      if (e.label === undefined) {
        return { ...base, data: routeData };
      }
      return { ...base, label: e.label, data: { label: e.label, ...routeData } };
    });

    // Connector edges attach from the flow card's RIGHT source handle to each assertion card, so
    // the column reads as branching off that node. No label, so the jsdom mock (label-only) skips
    // them. These are the ONE edge kind that stays on React Flow's built-in edge component rather
    // than xyflowEdgeAdapter, so they need the palette stroke applied here or they alone paint in
    // the library's cool default grey while every flow edge is warm.
    const observableEdges = laidOutFlow.nodes.flatMap((n) =>
      n.observables.map((obs) => ({
        id: `obs-edge:${String(n.id)}:${String(obs.id)}`,
        source: String(n.id),
        sourceHandle: flowHandleStatics.observableSourceId,
        target: `obs:${String(n.id)}:${String(obs.id)}`,
        style: { stroke: flowNodeStyleStatics.edgeStroke },
      })),
    );

    return [...flowEdges, ...observableEdges];
  }, [laidOutFlow, positions, routes]);

  if (flow.nodes.length === 0) {
    return null;
  }

  // The error card is for having NOTHING to show. A re-layout that fails over a graph already on
  // screen keeps that graph instead: a spec caught mid-edit is a state the next edit resolves, and
  // trading a readable canvas for "could not render" reports less than it destroys. The failure is
  // on the console either way.
  if (error && positions === null) {
    return (
      <div
        data-testid="FLOW_DIAGRAM_ERROR"
        style={{ color: colors.danger, fontFamily: 'monospace', fontSize: 12 }}
      >
        Could not render flow diagram
      </div>
    );
  }

  if (positions === null || laidOutFlow === null) {
    return null;
  }

  // Resolve the selection against the flow on the canvas every render, so a selected box that
  // disappears from the spec (an agent turn deleting a node) closes its panel instead of stranding
  // it — one layout pass after the deletion, when the canvas stops drawing that box.
  const selectedNode: FlowNode | undefined =
    selectedAnchor === null
      ? undefined
      : laidOutFlow.nodes.find((n) => String(n.id) === String(selectedAnchor.nodeId));

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
          flowId: laidOutFlow.id,
          nodeId: panelNode.id,
          ...(selectedAnchor.observableId === undefined
            ? {}
            : { observableId: selectedAnchor.observableId }),
        });

  return (
    <div
      ref={diagramRef}
      data-testid="FLOW_DIAGRAM"
      style={{
        display: 'flex',
        // The positioning context for the two things that float over the canvas: the detail panel
        // (top right) and the zoom controls (bottom left). Neither takes width from it, so the
        // graph is framed once and stays put for the whole review.
        position: 'relative',
        // Claims whatever height the spec panel left over, and passes a DEFINITE one down: React
        // Flow's canvas is height:100%, which resolves against the parent's `height` (NOT
        // minHeight or flex-basis), so an indefinite link anywhere in this chain collapses the
        // canvas to 0px and the diagram paints as an empty black panel. Every ancestor carries
        // `minHeight: 0` so it can shrink; this is the ONE link that refuses to, which is what
        // turns "not enough room" into a scroll on the SPEC tab rather than a clipped canvas.
        flex: 1,
        minHeight: MIN_CANVAS_HEIGHT,
      }}
    >
      <div
        data-testid="FLOW_DIAGRAM_CANVAS_WRAPPER"
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {React.createElement(
          xyflowReactFlowAdapter as unknown as React.ComponentType<Record<PropertyKey, unknown>>,
          {
            nodes,
            edges,
            nodeTypes: NODE_TYPES,
            edgeTypes: EDGE_TYPES,
            // Frame on the entry node rather than fitting the graph, so switching flow tabs starts
            // the reader at the first step at natural size instead of shrinking a tall graph until
            // every card is a speck.
            topAlign: true,
            onNodeClick: (node: (typeof nodes)[0]) => {
              // A flow card resolves by id. An assertion card does not — its React Flow id is a
              // composite (`obs:node:observable`), so its anchor is read off the node DATA, which
              // is the only place both ids survive independently of that string's shape.
              const clicked = laidOutFlow.nodes.find((fn) => String(fn.id) === node.id);
              if (clicked !== undefined) {
                setSelectedAnchor({ flowId: laidOutFlow.id, nodeId: clicked.id });
                return;
              }
              const observableData = flowObservableNodeDataContract.safeParse(node.data);
              // Neither a flow card nor an assertion card — a portal stand-in. Clicking one is a
              // no-op: it renders a node that lives in ANOTHER flow, so it has no box of its own.
              if (!observableData.success) {
                return;
              }
              setSelectedAnchor({
                flowId: laidOutFlow.id,
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
        data-testid="FLOW_DIAGRAM_CONTROLS"
        style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 10 }}
      >
        <IconButtonWidget
          label={ZOOM_IN_LABEL}
          testId={ZOOM_IN_TEST_ID}
          icon={IconZoomIn}
          size={CONTROL_SIZE}
          onClick={() => {
            clickNativeControl('react-flow__controls-zoomin');
          }}
        />
        <IconButtonWidget
          label={ZOOM_OUT_LABEL}
          testId={ZOOM_OUT_TEST_ID}
          icon={IconZoomOut}
          size={CONTROL_SIZE}
          onClick={() => {
            clickNativeControl('react-flow__controls-zoomout');
          }}
        />
        <IconButtonWidget
          label={FIT_VIEW_LABEL}
          testId={FIT_VIEW_TEST_ID}
          icon={IconFocusCentered}
          size={CONTROL_SIZE}
          onClick={() => {
            clickNativeControl('react-flow__controls-fitview');
          }}
        />
      </Group>
    </div>
  );
};
