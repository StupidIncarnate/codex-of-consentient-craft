import { screen } from '#gateway/npm/testing-library__react';

interface FlowDetailPanelContractEntryLayerWidgetProxyResult {
  getEntry: () => HTMLElement | null;
  getName: () => Node['textContent'];
  getPropertyTexts: () => Node['textContent'][];
}

export const FlowDetailPanelContractEntryLayerWidgetProxy =
  (): FlowDetailPanelContractEntryLayerWidgetProxyResult => ({
    getEntry: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACT_ENTRY'),
    getName: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACT_NAME')?.textContent ?? null,
    getPropertyTexts: (): Node['textContent'][] =>
      screen.queryAllByTestId('FLOW_DETAIL_PANEL_CONTRACT_PROPERTY').map((el) => el.textContent),
  });
