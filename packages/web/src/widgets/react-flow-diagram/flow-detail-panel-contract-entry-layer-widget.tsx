/**
 * PURPOSE: Renders one contract entry row in the flow node detail panel — the contract's name and
 * each of its properties. Layer widget for FlowNodeDetailPanelLayerWidget's contracts `.map`, whose
 * callback returned a JSX tree with element children before this split.
 *
 * USAGE:
 * <FlowDetailPanelContractEntryLayerWidget contract={questContractEntry} />
 * // Renders FLOW_DETAIL_PANEL_CONTRACT_ENTRY with the contract's name and property rows
 */

import type { QuestContractEntry } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface FlowDetailPanelContractEntryLayerWidgetProps {
  contract: QuestContractEntry;
}

const { colors } = emberDepthsThemeStatics;

export const FlowDetailPanelContractEntryLayerWidget = ({
  contract,
}: FlowDetailPanelContractEntryLayerWidgetProps): React.JSX.Element => (
  <div data-testid="FLOW_DETAIL_PANEL_CONTRACT_ENTRY" style={{ marginBottom: 8 }}>
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
);
