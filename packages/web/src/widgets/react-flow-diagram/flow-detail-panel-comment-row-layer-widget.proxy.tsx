import { screen } from '#gateway/npm/testing-library__react';

interface FlowDetailPanelCommentRowLayerWidgetProxyResult {
  getRow: () => HTMLElement | null;
  getText: () => Node['textContent'];
  getTime: () => Node['textContent'];
}

export const FlowDetailPanelCommentRowLayerWidgetProxy =
  (): FlowDetailPanelCommentRowLayerWidgetProxyResult => ({
    getRow: (): HTMLElement | null => screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_ROW'),
    getText: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT')?.textContent ?? null,
    getTime: (): Node['textContent'] =>
      screen.queryByTestId('FLOW_DETAIL_PANEL_COMMENT_TIME')?.textContent ?? null,
  });
