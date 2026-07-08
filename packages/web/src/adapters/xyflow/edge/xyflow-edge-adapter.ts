/**
 * PURPOSE: Custom @xyflow/react edge that draws itself along the ELK-computed route — the ordered
 * bend points ELK returns for the edge, which go AROUND the cards — instead of a straight line
 * through them. The branch label renders as a bounded-width WRAPPING HTML box (via
 * EdgeLabelRenderer) on that route's middle segment. Edges the layout did not route (e.g. jsdom
 * tests) fall back to a straight bezier.
 *
 * USAGE:
 * // Registered as an edgeTypes entry and referenced by edge.type:
 * const EDGE_TYPES = { flow: xyflowEdgeAdapter };
 * // <ReactFlow edgeTypes={EDGE_TYPES} edges=[{ ..., type: 'flow', data: { label, route } }] />
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
  const rawLabel = data?.label;
  const label = typeof rawLabel === 'string' ? rawLabel : undefined;

  // Fallback path for an edge the layout did not route: a straight bezier with the label at its
  // geometric midpoint.
  const [bezierPath, bezierLabelX, bezierLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // A back-edge (loop) has its target laid out ABOVE its source, so React Flow gives it a larger
  // sourceY than targetY. It attaches to the right-side loop handles; draw it as a clean rectangular
  // arc out to the right (dashed, below) so it reads as a return path, not part of the flow.
  const isBackEdge = sourceY > targetY;

  // ELK route (data.route): the ordered points ELK routed a FORWARD edge through, clear of every
  // card. ELK sizes nodes from an over-estimate, so its own endpoints can float in the reserved gap
  // beside a shorter card — snap them to React Flow's actual handles so the edge always touches both
  // cards, and keep ELK's interior bend points for the routing between.
  const rawRoute = data?.route;
  const elkPoints =
    Array.isArray(rawRoute) && rawRoute.length > 1
      ? rawRoute.map((point) => {
          const p = point as { x?: unknown; y?: unknown };
          return { x: Number(p.x), y: Number(p.y) };
        })
      : [];

  const loopDetourX = Math.max(sourceX, targetX) + elkLayoutStatics.loop.detour;
  const loopPoints = [
    { x: sourceX, y: sourceY },
    { x: loopDetourX, y: sourceY },
    { x: loopDetourX, y: targetY },
    { x: targetX, y: targetY },
  ];
  const routedPoints =
    elkPoints.length > 1
      ? [{ x: sourceX, y: sourceY }, ...elkPoints.slice(1, -1), { x: targetX, y: targetY }]
      : [];
  const points = isBackEdge ? loopPoints : routedPoints;
  const routed = points.length > 1;

  const edgePath = routed
    ? points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
    : bezierPath;

  const midIndex = Math.floor((points.length - 1) / elkLayoutStatics.edgeLabel.midpointDivisor);
  const segStart = points[midIndex];
  const segEnd = points[midIndex + 1];
  const onRoute = routed && segStart !== undefined && segEnd !== undefined;
  const labelX = onRoute
    ? [segStart.x, segEnd.x].reduce((sum, v) => sum + v, 0) / [segStart.x, segEnd.x].length
    : bezierLabelX;
  const labelY = onRoute
    ? [segStart.y, segEnd.y].reduce((sum, v) => sum + v, 0) / [segStart.y, segEnd.y].length
    : bezierLabelY;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(BaseEdge, {
      path: edgePath,
      ...(markerEnd === undefined ? {} : { markerEnd }),
      ...(isBackEdge ? { style: { strokeDasharray: '6 4' } } : {}),
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
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              },
            },
            label,
          ),
        ),
  );
};
