import { screen } from '@testing-library/react';

interface FlowDetailPanelCommentRowLayerWidgetProxyResult {
  getRow: () => HTMLElement | null;
  getText: () => HTMLElement['textContent'];
  getTime: () => HTMLElement['textContent'];
}

export const FlowDetailPanelCommentRowLayerWidgetProxy =
  (): FlowDetailPanelCommentRowLayerWidgetProxyResult => ({
    getRow: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_ROW'),
    getText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT')?.textContent ?? null,
    getTime: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_TIME')?.textContent ?? null,
  });
