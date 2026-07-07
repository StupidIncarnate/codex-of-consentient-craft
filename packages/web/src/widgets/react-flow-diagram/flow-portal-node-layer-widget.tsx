/**
 * PURPOSE: Renders a "portal" node — the stand-in card for an edge that leaves this flow for a node
 * in another flow (a `flowId:nodeId` cross-flow reference). Drawn with a dashed accent border so a
 * reviewer reads it as a hand-off marker, not an in-flow node. Registered under the `portal` node
 * type so React Flow anchors the cross-flow edge to it instead of dropping the edge.
 *
 * USAGE:
 * <FlowPortalNodeLayerWidget data={flowPortalNodeData} />
 * // Renders a FLOW_PORTAL_NODE card showing the cross-flow target label.
 */

import { xyflowNodeHandlesAdapter } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter';
import type { FlowPortalNodeData } from '../../contracts/flow-portal-node-data/flow-portal-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowPortalNodeLayerWidgetProps {
  /** Portal node data supplied by @xyflow/react via the nodeTypes registry */
  data: FlowPortalNodeData;
}

const { colors } = emberDepthsThemeStatics;

export const FlowPortalNodeLayerWidget = ({
  data,
}: FlowPortalNodeLayerWidgetProps): React.JSX.Element => {
  const { label } = data;

  return (
    <div
      data-testid="FLOW_PORTAL_NODE"
      style={{
        // Pin to elk's reserved node width (border-box) so the label wraps inside the box elk
        // reserved for the portal and it never overlaps a neighbouring card.
        width: elkLayoutStatics.node.width,
        boxSizing: 'border-box',
        background: colors['bg-deep'],
        border: `1px dashed ${colors.primary}`,
        borderRadius: 6,
        padding: '8px 12px',
        color: colors.primary,
        fontFamily: 'monospace',
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'normal',
        overflowWrap: 'break-word',
      }}
    >
      {xyflowNodeHandlesAdapter()}
      <div data-testid="FLOW_PORTAL_NODE_LABEL">{label}</div>
    </div>
  );
};
