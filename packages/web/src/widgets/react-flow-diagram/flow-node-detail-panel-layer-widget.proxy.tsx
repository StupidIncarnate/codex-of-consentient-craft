import { screen } from '@testing-library/react';

interface FlowNodeDetailPanelLayerWidgetProxyResult {
  getPanel: () => HTMLElement | null;
  getHeading: () => HTMLElement | null;
  getEmpty: () => HTMLElement | null;
  getObservableRows: () => NodeListOf<HTMLElement> | null;
  getContractEntries: () => NodeListOf<HTMLElement> | null;
  getCloseButton: () => HTMLElement | null;
}

export const FlowNodeDetailPanelLayerWidgetProxy =
  (): FlowNodeDetailPanelLayerWidgetProxyResult => ({
    getPanel: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_DETAIL_PANEL'),
    getHeading: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_HEADING'),
    getEmpty: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_EMPTY'),
    getObservableRows: (): NodeListOf<HTMLElement> | null => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      return panel
        ? panel.querySelectorAll('[data-testid="FLOW_DETAIL_PANEL_OBSERVABLE_ROW"]')
        : null;
    },
    getContractEntries: (): NodeListOf<HTMLElement> | null => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      return panel
        ? panel.querySelectorAll('[data-testid="FLOW_DETAIL_PANEL_CONTRACT_ENTRY"]')
        : null;
    },
    getCloseButton: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_CLOSE'),
  });
