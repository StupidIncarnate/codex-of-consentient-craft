import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';

interface FlowPortalNodeLayerWidgetProxyResult {
  getNode: () => HTMLElement | null;
  getLabel: () => HTMLElement | null;
}

export const FlowPortalNodeLayerWidgetProxy = (): FlowPortalNodeLayerWidgetProxyResult => {
  xyflowNodeHandlesAdapterProxy();

  return {
    getNode: (): HTMLElement | null => screen.queryByTestId('FLOW_PORTAL_NODE'),
    getLabel: (): HTMLElement | null => screen.queryByTestId('FLOW_PORTAL_NODE_LABEL'),
  };
};
