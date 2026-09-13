import { screen } from '@testing-library/react';

import { FlowDetailPanelCommentRowLayerWidgetProxy } from './flow-detail-panel-comment-row-layer-widget.proxy';
import { FlowDetailPanelContractEntryLayerWidgetProxy } from './flow-detail-panel-contract-entry-layer-widget.proxy';
import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';

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
  (): FlowNodeDetailPanelLayerWidgetProxyResult => {
    // The panel's close control is an IconButtonWidget. Its proxy mocks nothing, so this constructs
    // it for the child-proxy rule only — the close button is addressed here by its own testid.
    IconButtonWidgetProxy();
    // Neither row widget below has a dependency of its own to mock; constructed here only for the
    // child-proxy rule, and addressed in tests by their own testids.
    FlowDetailPanelContractEntryLayerWidgetProxy();
    FlowDetailPanelCommentRowLayerWidgetProxy();

    return {
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
    };
  };
