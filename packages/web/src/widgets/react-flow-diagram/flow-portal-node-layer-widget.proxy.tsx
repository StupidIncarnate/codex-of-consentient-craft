import { screen } from '#gateway/npm/testing-library__react';

import { FlowNodeHandlesWidgetProxy } from '../flow-node-handles/flow-node-handles-widget.proxy';

interface FlowPortalNodeLayerWidgetProxyResult {
  getNode: () => HTMLElement | null;
  getLabel: () => HTMLElement | null;
  countCommentButtons: () => HTMLElement['childElementCount'];
}

export const FlowPortalNodeLayerWidgetProxy = (): FlowPortalNodeLayerWidgetProxyResult => {
  FlowNodeHandlesWidgetProxy();

  return {
    getNode: (): HTMLElement | null => screen.queryByTestId('FLOW_PORTAL_NODE'),
    getLabel: (): HTMLElement | null => screen.queryByTestId('FLOW_PORTAL_NODE_LABEL'),
    countCommentButtons: (): HTMLElement['childElementCount'] =>
      screen.queryAllByTestId('COMMENT_BUTTON').length,
  };
};
