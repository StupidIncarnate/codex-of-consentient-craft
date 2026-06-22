/**
 * PURPOSE: Boundary wrapper around @xyflow/react Handle — renders the target (top) and
 * source (bottom) connection handles a custom React Flow node needs so edges can attach.
 * Without these handles React Flow drops every edge ("source handle id: null") and the
 * diagram renders disconnected node cards with no connecting lines or branch labels.
 *
 * USAGE:
 * React.createElement(FlowNodeCardLayerWidget, props,
 *   React.createElement(xyflowNodeHandlesAdapter),
 * );
 * // Renders an invisible target handle on top and source handle on bottom, matching the
 * // elk top-down ('DOWN') layout so edges flow from a node's bottom to the next node's top.
 */

import React from 'react';

import { Handle, Position } from '@xyflow/react';

const HIDDEN_HANDLE_STYLE = { opacity: 0 } as const;

export const xyflowNodeHandlesAdapter = (): React.JSX.Element =>
  React.createElement(
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
  );
