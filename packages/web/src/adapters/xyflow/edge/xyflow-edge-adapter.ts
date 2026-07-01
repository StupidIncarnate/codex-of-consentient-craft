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
  maxWidth: elkLayoutStatics.edgeLabelMaxWidth,
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const rawLabel = data?.label;
  const label = typeof rawLabel === 'string' ? rawLabel : undefined;

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
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              },
            },
            label,
          ),
        ),
  );
};
