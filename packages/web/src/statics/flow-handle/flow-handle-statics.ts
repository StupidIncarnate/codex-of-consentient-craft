/**
 * PURPOSE: Immutable @xyflow/react connection-handle ids shared between the node-handles adapter
 * (which renders the handles) and the diagram widget (which references them on edges). The flow
 * card carries a default bottom source handle (id null) for the main flow edges plus a dedicated
 * RIGHT source handle, `observableSourceId`, that the assertion connector edges attach to so an
 * assertion column branches off the card's right side instead of its bottom.
 *
 * USAGE:
 * flowHandleStatics.observableSourceId;
 * // Returns 'flow-node-observable-source'
 */

export const flowHandleStatics = {
  observableSourceId: 'flow-node-observable-source',
} as const;
