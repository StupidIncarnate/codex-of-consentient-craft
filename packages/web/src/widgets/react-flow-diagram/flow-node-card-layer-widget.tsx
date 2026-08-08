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
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { flowNodeStyleStatics } from '../../statics/flow-node-style/flow-node-style-statics';
import { CommentPopoverWidget } from '../comment-popover/comment-popover-widget';

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

const { colors } = emberDepthsThemeStatics;

export const FlowNodeCardLayerWidget = ({
  data,
  selected,
}: FlowNodeCardLayerWidgetProps): React.JSX.Element => {
  const { nodeType, label, contractCount, commentCount, nodeId, questId, flowId } = data;
  const accentColor = flowNodeStyleStatics.accent[nodeType];
  const TypeIcon = NODE_TYPE_ICONS[nodeType];

  const ringStyle = selected ? { outline: `2px solid ${flowNodeStyleStatics.selectionRing}` } : {};

  return (
    <div
      data-testid="FLOW_NODE"
      data-selected={selected ? 'true' : undefined}
      data-accent-color={accentColor}
      style={{
        // Raised above the canvas, where the assertion and portal cards sit on `bg-deep` — the one
        // shade of separation is what makes the spine read as the primary column.
        background: colors['bg-surface'],
        border: `1px solid ${accentColor}`,
        borderRadius: 6,
        padding: '8px 12px',
        // Pin every card to elk's reserved box width (border-box) so a card never grows past
        // the rectangle elk laid out for it — long-sentence labels wrap instead of ballooning,
        // and adjacent cards can't overlap.
        width: elkLayoutStatics.node.width,
        boxSizing: 'border-box',
        color: colors.text,
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
          // Show the FULL label on the card — wrap it (elk reserves a box tall enough for every
          // line, so the card never overflows its row). The detail panel adds observables and
          // contracts, but the main text is always readable without clicking.
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        {label}
      </div>
      {contractCount > 0 ? (
        <div
          data-testid="FLOW_NODE_BADGE"
          title="contracts"
          style={{
            background: accentColor,
            color: colors['bg-deep'],
            borderRadius: 10,
            fontSize: 10,
            padding: '1px 6px',
            display: 'inline-block',
            marginTop: 4,
          }}
        >
          {String(contractCount)}
        </div>
      ) : null}
      {commentCount > 0 ? (
        <div
          data-testid="COMMENT_COUNT_BADGE"
          title="comments"
          style={{
            background: colors.primary,
            color: colors['bg-deep'],
            borderRadius: 10,
            fontSize: 10,
            padding: '1px 6px',
            display: 'inline-block',
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {String(commentCount)}
        </div>
      ) : null}
      {/* questId and flowId ride in on the node data only while the comment compose controls are
          allowed for this quest, so their absence is what leaves the card with no comment button. */}
      {questId === undefined || flowId === undefined ? null : (
        <CommentPopoverWidget questId={questId} flowId={flowId} nodeId={nodeId} />
      )}
    </div>
  );
};
