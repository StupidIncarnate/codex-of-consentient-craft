/**
 * PURPOSE: Boundary wrapper around @xyflow/react Handle — renders the connection handles a custom
 * React Flow node needs so edges can attach. Without handles React Flow drops every edge ("source
 * handle id: null") and the diagram renders disconnected cards with no connecting lines.
 *
 * The `flow-node` variant (default) renders a top target + bottom source (the top-down main flow)
 * plus a RIGHT source handle (`flowHandleStatics.observableSourceId`) that assertion connector
 * edges attach to, so an assertion column branches off the card's right side. The `observable`
 * variant renders a single LEFT target handle for the assertion card those connectors point at.
 *
 * USAGE:
 * React.createElement(FlowNodeCardLayerWidget, props, xyflowNodeHandlesAdapter());
 * // Flow card: invisible top-target, bottom-source, and right-source handles.
 * xyflowNodeHandlesAdapter({ variant: 'observable' });
 * // Assertion card: a single invisible left-target handle.
 */

import React from 'react';

import { Handle, Position } from '@xyflow/react';

import { flowHandleStatics } from '../../../statics/flow-handle/flow-handle-statics';

const HIDDEN_HANDLE_STYLE = { opacity: 0 } as const;

export const xyflowNodeHandlesAdapter = ({
  variant = 'flow-node',
}: { variant?: 'flow-node' | 'observable' } = {}): React.JSX.Element => {
  if (variant === 'observable') {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Handle, {
        type: 'target',
        position: Position.Left,
        style: HIDDEN_HANDLE_STYLE,
      }),
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Handle, {
      type: 'target',
      position: Position.Top,
      style: HIDDEN_HANDLE_STYLE,
    }),
    React.createElement(Handle, {
      type: 'source',
      position: Position.Bottom,
      style: HIDDEN_HANDLE_STYLE,
    }),
    React.createElement(Handle, {
      type: 'source',
      position: Position.Right,
      id: flowHandleStatics.observableSourceId,
      style: HIDDEN_HANDLE_STYLE,
    }),
    // Loop (back-edge) handles on the RIGHT side, so an upward route exits/re-enters from the side
    // of the card rather than the top/bottom — visually distinct from the downward flow.
    React.createElement(Handle, {
      type: 'source',
      position: Position.Right,
      id: flowHandleStatics.loopSourceId,
      style: HIDDEN_HANDLE_STYLE,
    }),
    React.createElement(Handle, {
      type: 'target',
      position: Position.Right,
      id: flowHandleStatics.loopTargetId,
      style: HIDDEN_HANDLE_STYLE,
    }),
  );
};
