/**
 * PURPOSE: Renders a single assertion (observable) as a custom React Flow node — the small card
 * that branches off to the right of a flow node. Shows the outcome-type tag and the FULL
 * description so a reviewer reads every acceptance criterion on the canvas without opening a panel.
 *
 * USAGE:
 * <FlowObservableNodeLayerWidget data={flowObservableNodeData} />
 * // Renders a FLOW_OBSERVABLE_NODE card with a type tag and wrapped description text.
 */

import { xyflowNodeHandlesAdapter } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter';
import type { FlowObservableNodeData } from '../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowObservableNodeLayerWidgetProps {
  /** Assertion node data supplied by @xyflow/react via the nodeTypes registry */
  data: FlowObservableNodeData;
}

const { colors } = emberDepthsThemeStatics;

export const FlowObservableNodeLayerWidget = ({
  data,
}: FlowObservableNodeLayerWidgetProps): React.JSX.Element => {
  const { outcomeType, description } = data;

  return (
    <div
      data-testid="FLOW_OBSERVABLE_NODE"
      style={{
        // Pin to elk's reserved assertion-card width (border-box) so the description wraps inside
        // the rectangle elk reserved for the column and cards never overlap.
        width: elkLayoutStatics.observable.width,
        boxSizing: 'border-box',
        background: colors['bg-deep'],
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        padding: '6px 8px',
        color: colors.text,
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      {xyflowNodeHandlesAdapter({ variant: 'observable' })}
      <span
        data-testid="FLOW_OBSERVABLE_NODE_TYPE"
        style={{
          display: 'inline-block',
          background: colors['bg-raised'],
          border: `1px solid ${colors.border}`,
          borderRadius: 4,
          padding: '1px 6px',
          fontSize: 10,
          color: colors.primary,
          marginBottom: 4,
        }}
      >
        {outcomeType}
      </span>
      <div
        data-testid="FLOW_OBSERVABLE_NODE_DESC"
        style={{ whiteSpace: 'normal', overflowWrap: 'break-word', lineHeight: 1.3 }}
      >
        {description}
      </div>
    </div>
  );
};
