import { screen } from '@testing-library/react';

interface FlowNodeDetailPanelLayerWidgetProxyResult {
  getPanel: () => HTMLElement | null;
  getHeading: () => HTMLElement | null;
  getEmpty: () => HTMLElement | null;
  getContractEntries: () => NodeListOf<HTMLElement> | null;
  getCloseButton: () => HTMLElement | null;
  getCommentsSection: () => HTMLElement | null;
  getCommentRows: () => HTMLElement[];
  getCommentTexts: () => HTMLElement['textContent'][];
  getCommentTimes: () => HTMLElement['textContent'][];
}

export const FlowNodeDetailPanelLayerWidgetProxy =
  (): FlowNodeDetailPanelLayerWidgetProxyResult => ({
    getPanel: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_DETAIL_PANEL'),
    getHeading: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_HEADING'),
    getEmpty: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_EMPTY'),
    getContractEntries: (): NodeListOf<HTMLElement> | null => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      return panel
        ? panel.querySelectorAll('[data-testid="FLOW_DETAIL_PANEL_CONTRACT_ENTRY"]')
        : null;
    },
    getCloseButton: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_CLOSE'),
    getCommentsSection: (): HTMLElement | null =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENTS'),
    getCommentRows: (): HTMLElement[] => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      return panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>('[data-testid="FLOW_DETAIL_PANEL_COMMENT_ROW"]'),
          )
        : [];
    },
    getCommentTexts: (): HTMLElement['textContent'][] => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      if (panel === null) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>('[data-testid="FLOW_DETAIL_PANEL_COMMENT_TEXT"]'),
      ).map((el) => el.textContent);
    },
    getCommentTimes: (): HTMLElement['textContent'][] => {
      const panel = screen.queryByTestId('FLOW_NODE_DETAIL_PANEL');
      if (panel === null) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>('[data-testid="FLOW_DETAIL_PANEL_COMMENT_TIME"]'),
      ).map((el) => el.textContent);
    },
  });
