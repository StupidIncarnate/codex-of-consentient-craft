/**
 * PURPOSE: Renders a single flow node card as a custom node component for @xyflow/react.
 * Shows type icon, label, observable badge, and selected ring styling.
 *
 * USAGE:
 * <FlowNodeCardLayerWidget id="login-page" data={reactFlowNodeData} selected={false} type="state" />
 * // Renders a dark-theme RPG node card with accent color by type
 */

import { IconCircle, IconDiamond, IconPlayerPlay, IconSquare } from '@tabler/icons-react';

import type { FlowNodeType } from '@dungeonmaster/shared/contracts';

import { xyflowNodeHandlesAdapter } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter';
import type { ReactFlowNodeData } from '../../contracts/react-flow-node-data/react-flow-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { flowNodeStyleStatics } from '../../statics/flow-node-style/flow-node-style-statics';

export interface FlowNodeCardLayerWidgetProps {
  /** Node id from @xyflow/react — external API signature */
  id: ReactFlowNodeData['nodeId'];
  data: ReactFlowNodeData;
  /** Selected flag driven by the parent's selectedNodeId state */
  selected: boolean;
  /** Node type string from @xyflow/react nodeTypes registry */
  type: FlowNodeType;
}

const NODE_TYPE_ICONS: Record<FlowNodeType, typeof IconDiamond> = {
  decision: IconDiamond,
  action: IconPlayerPlay,
  state: IconSquare,
  terminal: IconCircle,
};

export const FlowNodeCardLayerWidget = ({
  data,
  selected,
}: FlowNodeCardLayerWidgetProps): React.JSX.Element => {
  const { nodeType, label, observableCount } = data;
  const accentColor = flowNodeStyleStatics.accent[nodeType];
  const TypeIcon = NODE_TYPE_ICONS[nodeType];

  const ringStyle = selected ? { outline: `2px solid ${flowNodeStyleStatics.selectionRing}` } : {};

  return (
    <div
      data-testid="FLOW_NODE"
      data-selected={selected ? 'true' : undefined}
      data-accent-color={accentColor}
      style={{
        background: '#1a110d',
        border: `1px solid ${accentColor}`,
        borderRadius: 6,
        padding: '8px 12px',
        // Pin every card to elk's reserved box width (border-box) so a card never grows past
        // the rectangle elk laid out for it — long-sentence labels wrap instead of ballooning,
        // and adjacent cards can't overlap.
        width: elkLayoutStatics.node.width,
        boxSizing: 'border-box',
        color: '#e0cfc0',
        fontFamily: 'monospace',
        ...ringStyle,
      }}
    >
      {xyflowNodeHandlesAdapter()}
      <div data-testid="FLOW_NODE_TYPE_ICON" style={{ color: accentColor, marginBottom: 4 }}>
        <TypeIcon size={14} />
      </div>
      <div
        data-testid="FLOW_NODE_LABEL"
        style={{
          fontSize: 12,
          fontWeight: 600,
          // Clamp the label to a fixed line count so the card stays within elk's reserved
          // height; the full text is shown in the detail panel when the node is clicked.
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: elkLayoutStatics.labelMaxLines,
          overflow: 'hidden',
          overflowWrap: 'break-word',
        }}
      >
        {label}
      </div>
      {observableCount > 0 ? (
        <div
          data-testid="FLOW_NODE_BADGE"
          style={{
            background: accentColor,
            color: '#0d0907',
            borderRadius: 10,
            fontSize: 10,
            padding: '1px 6px',
            display: 'inline-block',
            marginTop: 4,
          }}
        >
          {String(observableCount)}
        </div>
      ) : null}
    </div>
  );
};
