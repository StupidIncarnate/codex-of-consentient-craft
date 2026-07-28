/**
 * PURPOSE: Renders the right-side detail panel for a selected flow box — either a flow node card
 * or one of its assertion (observable) cards. A node panel lists the contracts anchored to it; an
 * observable panel has no contracts of its own (contracts anchor to nodes, not assertions). Both
 * kinds list their own persisted comments, newest first, exactly as the caller ordered them.
 *
 * USAGE:
 * <FlowNodeDetailPanelLayerWidget node={flowNode} contracts={contracts} comments={comments} onClose={() => setSelectedId(null)} />
 * // Renders FLOW_NODE_DETAIL_PANEL with contract entries, comments, and a close button
 *
 * <FlowNodeDetailPanelLayerWidget node={flowNode} contracts={contracts} comments={comments} observable={observable} onClose={() => setSelectedId(null)} />
 * // Renders the panel for an assertion card: heading = observable.description, no contracts section
 */

import { ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

import type {
  FlowNode,
  FlowObservable,
  QuestComment,
  QuestContractEntry,
} from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowNodeDetailPanelLayerWidgetProps {
  node: FlowNode;
  contracts: readonly QuestContractEntry[];
  /** Comments anchored to the selected box, ALREADY filtered and ALREADY sorted newest-first by the caller. */
  comments: readonly QuestComment[];
  /**
   * Present when the selected box is one of the node's assertion cards rather than the node itself.
   * The panel then titles itself with the assertion's description and shows no contracts, because
   * contracts anchor to nodes, not to assertions.
   */
  observable?: FlowObservable;
  onClose: () => void;
}

export const FlowNodeDetailPanelLayerWidget = ({
  node,
  contracts,
  comments,
  observable,
  onClose,
}: FlowNodeDetailPanelLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const matchingContracts =
    observable === undefined ? contracts.filter((c) => String(c.nodeId) === String(node.id)) : [];
  const hasContent = matchingContracts.length > 0 || comments.length > 0;
  const heading = observable === undefined ? node.label : observable.description;

  return (
    <div
      data-testid="FLOW_NODE_DETAIL_PANEL"
      style={{
        background: colors['bg-raised'],
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 16,
        minWidth: 280,
        maxWidth: 400,
        color: colors.text,
        fontFamily: 'monospace',
        fontSize: 12,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          data-testid="FLOW_DETAIL_PANEL_HEADING"
          style={{ fontWeight: 700, fontSize: 13, color: colors.primary }}
        >
          {heading}
        </div>
        <ActionIcon
          data-testid="FLOW_DETAIL_PANEL_CLOSE"
          size={20}
          variant="subtle"
          onClick={onClose}
          style={{ color: colors['text-dim'] }}
        >
          <IconX size={14} />
        </ActionIcon>
      </div>

      {hasContent ? null : (
        <div data-testid="FLOW_DETAIL_PANEL_EMPTY" style={{ color: colors['text-dim'] }}>
          No contracts or comments for this box
        </div>
      )}

      {matchingContracts.length > 0 ? (
        <div data-testid="FLOW_DETAIL_PANEL_CONTRACTS">
          {matchingContracts.map((contract) => (
            <div
              key={String(contract.id)}
              data-testid="FLOW_DETAIL_PANEL_CONTRACT_ENTRY"
              style={{ marginBottom: 8 }}
            >
              <div
                data-testid="FLOW_DETAIL_PANEL_CONTRACT_NAME"
                style={{ fontWeight: 600, color: colors.primary, marginBottom: 4 }}
              >
                {contract.name}
              </div>
              {contract.properties.map((prop) => (
                <div
                  key={String(prop.name)}
                  data-testid="FLOW_DETAIL_PANEL_CONTRACT_PROPERTY"
                  style={{ color: colors['text-dim'], paddingLeft: 8 }}
                >
                  {prop.name}: {prop.type}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {comments.length > 0 ? (
        <div data-testid="FLOW_DETAIL_PANEL_COMMENTS" style={{ marginTop: 12 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 11,
              color: colors['text-dim'],
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            COMMENTS
          </div>
          {comments.map((comment) => (
            <div
              key={String(comment.id)}
              data-testid="FLOW_DETAIL_PANEL_COMMENT_ROW"
              style={{
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div
                data-testid="FLOW_DETAIL_PANEL_COMMENT_TEXT"
                style={{ color: colors.text, whiteSpace: 'pre-wrap' }}
              >
                {comment.text}
              </div>
              <div
                data-testid="FLOW_DETAIL_PANEL_COMMENT_TIME"
                style={{ color: colors['text-dim'], fontSize: 10, marginTop: 4 }}
              >
                {comment.createdAt}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
