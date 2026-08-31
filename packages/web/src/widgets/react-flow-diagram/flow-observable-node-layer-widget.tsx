/**
 * PURPOSE: Renders a single assertion (observable) as a custom React Flow node — the small card
 * that branches off to the right of a flow node. Shows the outcome-type tag and the FULL
 * description so a reviewer reads every acceptance criterion on the canvas without opening a panel.
 *
 * The `read-check` chip is the one mark here that changes what the reader owes the card. Its outcome
 * type still reads `custom` or `ui-state`, because that is honestly what kind of outcome it is — so
 * the type tag alone tells a reviewer to go drive something, when what this one needs is a source
 * file opened.
 *
 * USAGE:
 * <FlowObservableNodeLayerWidget data={flowObservableNodeData} />
 * // Renders a FLOW_OBSERVABLE_NODE card with a type tag and wrapped description text.
 */

import { xyflowNodeHandlesAdapter } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter';
import type { FlowObservableNodeData } from '../../contracts/flow-observable-node-data/flow-observable-node-data-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { packageChipAccentTransformer } from '../../transformers/package-chip-accent/package-chip-accent-transformer';
import { CommentPopoverWidget } from '../comment-popover/comment-popover-widget';

export interface FlowObservableNodeLayerWidgetProps {
  /** Assertion node data supplied by @xyflow/react via the nodeTypes registry */
  data: FlowObservableNodeData;
}

const { colors } = emberDepthsThemeStatics;

export const FlowObservableNodeLayerWidget = ({
  data,
}: FlowObservableNodeLayerWidgetProps): React.JSX.Element => {
  const {
    outcomeType,
    description,
    package: observablePackage,
    observableId,
    nodeId,
    questId,
    flowId,
    commentCount,
    verifyByReading,
  } = data;
  const packageAccent = packageChipAccentTransformer(
    observablePackage.packageType === undefined
      ? {}
      : { packageType: observablePackage.packageType },
  );

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
      {/* The type tag and the package chip share ONE row, wrapping together when the names are long
          (elkLayoutStatics.observable.labelEstimate.chromeHeight reserves the second line). Putting
          the package here rather than under the description is what lets a reviewer read a glue
          node's two sides off its assertion column without opening anything: the parent card names
          both packages, and these cards say which criterion is read on which side. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
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
        <span
          data-testid="FLOW_OBSERVABLE_NODE_PACKAGE"
          {...(observablePackage.packageType === undefined
            ? {}
            : { 'data-package-type': observablePackage.packageType })}
          // The resolved token, stated as data rather than only as CSS: a browser reports the
          // applied colour as `rgb(...)` and jsdom rewrites it too, so an assertion against the
          // palette would be comparing two different notations.
          data-package-accent={packageAccent}
          style={{
            display: 'inline-block',
            background: colors['bg-raised'],
            border: `1px solid ${packageAccent}`,
            borderRadius: 3,
            padding: '0px 4px',
            fontSize: 9,
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            color: packageAccent,
            marginBottom: 4,
          }}
        >
          {observablePackage.name}
        </span>
        {/* Sits AFTER the type tag it qualifies, and carries the warning accent rather than the
            package accent: it is the one chip on this row that changes what the reader has to DO
            with the card, and a third neutral chip reads as a third label. */}
        {verifyByReading === true ? (
          <span
            data-testid="FLOW_OBSERVABLE_NODE_READ_CHECK"
            title="settled by opening the source file, not by running a test"
            style={{
              display: 'inline-block',
              background: colors['bg-raised'],
              border: `1px solid ${colors.warning}`,
              borderRadius: 3,
              padding: '0px 4px',
              fontSize: 9,
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
              color: colors.warning,
              marginBottom: 4,
            }}
          >
            read-check
          </span>
        ) : null}
      </div>
      <div
        data-testid="FLOW_OBSERVABLE_NODE_DESC"
        style={{ whiteSpace: 'normal', overflowWrap: 'break-word', lineHeight: 1.3 }}
      >
        {description}
      </div>
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
          }}
        >
          {String(commentCount)}
        </div>
      ) : null}
      {/* An assertion card anchors its own comment: observableId identifies the card, nodeId keeps
          it findable from the parent node. questId/flowId are absent unless composing is allowed;
          nodeId is always present (it is not part of the compose gate). */}
      {questId === undefined || flowId === undefined ? null : (
        <CommentPopoverWidget
          questId={questId}
          flowId={flowId}
          nodeId={nodeId}
          observableId={observableId}
        />
      )}
    </div>
  );
};
