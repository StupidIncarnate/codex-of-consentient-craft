import { screen } from '@testing-library/react';

interface FlowDetailPanelContractEntryLayerWidgetProxyResult {
  getEntry: () => HTMLElement | null;
  getName: () => HTMLElement['textContent'];
  getPropertyTexts: () => HTMLElement['textContent'][];
}

export const FlowDetailPanelContractEntryLayerWidgetProxy =
  (): FlowDetailPanelContractEntryLayerWidgetProxyResult => ({
    getEntry: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACT_ENTRY'),
    getName: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_CONTRACT_NAME')?.textContent ?? null,
    getPropertyTexts: (): HTMLElement['textContent'][] =>
      screen.queryAllByTestId('FLOW_DETAIL_PANEL_CONTRACT_PROPERTY').map((el) => el.textContent),
  });
