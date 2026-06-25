/**
 * PURPOSE: Renders the right-side detail panel listing the contracts anchored to a selected flow
 * node. Assertions (observables) render as their own nodes on the canvas, so the panel is the
 * contract reference only.
 *
 * USAGE:
 * <FlowNodeDetailPanelLayerWidget node={flowNode} contracts={contracts} onClose={() => setSelectedId(null)} />
 * // Renders FLOW_NODE_DETAIL_PANEL with contract entries and a close button
 */

import { ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

import type { FlowNode, QuestContractEntry } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowNodeDetailPanelLayerWidgetProps {
  node: FlowNode;
  contracts: readonly QuestContractEntry[];
  onClose: () => void;
}

export const FlowNodeDetailPanelLayerWidget = ({
  node,
  contracts,
  onClose,
}: FlowNodeDetailPanelLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const matchingContracts = contracts.filter((c) => String(c.nodeId) === String(node.id));
  const hasContent = matchingContracts.length > 0;

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
          {node.label}
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
          No contracts for this node
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
    </div>
  );
};
