/**
 * PURPOSE: Custom @xyflow/react edge that renders the bezier path AND the branch label as a
 * bounded-width WRAPPING HTML box (via EdgeLabelRenderer) instead of React Flow's default
 * single-line SVG label. The full condition text is shown (wrapped over several lines, plus a
 * hover title) and the bounded width keeps two sibling-branch labels from painting over each
 * other at the edge midpoint.
 *
 * USAGE:
 * // Registered as an edgeTypes entry and referenced by edge.type:
 * const EDGE_TYPES = { flow: xyflowEdgeAdapter };
 * // <ReactFlow edgeTypes={EDGE_TYPES} edges=[{ ..., type: 'flow', data: { label } }] />
 */

import React from 'react';

import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

import { elkLayoutStatics } from '../../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../../statics/ember-depths-theme/ember-depths-theme-statics';

const { colors } = emberDepthsThemeStatics;

const LABEL_BOX_STYLE = {
  position: 'absolute',
  maxWidth: elkLayoutStatics.edgeLabel.maxWidth,
  background: colors['bg-raised'],
  color: colors.text,
  border: `1px solid ${colors.border}`,
  borderRadius: 4,
  padding: '2px 6px',
  fontSize: 10,
  fontFamily: 'monospace',
  lineHeight: 1.3,
  whiteSpace: 'normal',
  overflowWrap: 'break-word',
  // Labels live in a portal layer above the pane; re-enable pointer events so the hover title
  // (full text) works.
  pointerEvents: 'all',
} as const;

export const xyflowEdgeAdapter = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps): React.ReactElement => {
  // A back-edge (loop) targets a node ABOVE its source — e.g. a per-file processing loop that jumps
  // from the tail of the pipeline back to its head. getBezierPath would draw it as a straight line
  // UP through every intermediate card; instead bow it out to the side of the stack (past the node
  // spine by `loop.detour`) so it reads as an arc around the pipeline.
  const isLoop = sourceY - targetY > elkLayoutStatics.spacing.nodeNodeBetweenLayers;

  let [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  if (isLoop) {
    const detourX = Math.max(sourceX, targetX) + elkLayoutStatics.loop.detour;
    edgePath = `M${sourceX},${sourceY} C${detourX},${sourceY} ${detourX},${targetY} ${targetX},${targetY}`;
    labelX = detourX;
    labelY = [sourceY, targetY].reduce((sum, y) => sum + y, 0) / [sourceY, targetY].length;
  }

  const rawLabel = data?.label;
  const label = typeof rawLabel === 'string' ? rawLabel : undefined;

  // React Flow paints the label at the edge's geometric midpoint. Three cases override that:
  //  0. Loop — the label sits on the detour arc (labelX/labelY above), off the stack entirely.
  //  1. Sibling spreading — when a decision has 2+ labeled branches,
  //     flowBranchLabelOffsetsTransformer hands each edge a horizontal `labelOffsetX` that pushes
  //     crowded siblings apart into one aligned row at the fork (0 when already clear).
  //  2. Lone skip edge — a single branch that reconverges more than one layer down
  //     (span > skipLayerThreshold) would have its midpoint land on the intervening card; anchor
  //     it in the inter-layer gap just below the source, interpolated along the source→target line.
  const { skipLayerDrop, skipLayerThreshold } = elkLayoutStatics.edgeLabel;
  const rawOffset = data?.labelOffsetX;
  const siblingOffsetX = typeof rawOffset === 'number' ? rawOffset : undefined;
  const verticalSpan = targetY - sourceY;
  const skipsLayer = verticalSpan > skipLayerThreshold;

  let positionX = labelX;
  let positionY = labelY;
  if (!isLoop && siblingOffsetX !== undefined) {
    positionX = labelX + siblingOffsetX;
    positionY = sourceY + skipLayerDrop;
  } else if (!isLoop && skipsLayer) {
    positionX = sourceX + (skipLayerDrop / verticalSpan) * (targetX - sourceX);
    positionY = sourceY + skipLayerDrop;
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(BaseEdge, {
      path: edgePath,
      ...(markerEnd === undefined ? {} : { markerEnd }),
    }),
    label === undefined
      ? null
      : React.createElement(
          EdgeLabelRenderer,
          null,
          React.createElement(
            'div',
            {
              'data-testid': 'FLOW_EDGE_LABEL',
              title: label,
              style: {
                ...LABEL_BOX_STYLE,
                transform: `translate(-50%, -50%) translate(${positionX}px, ${positionY}px)`,
              },
            },
            label,
          ),
        ),
  );
};
