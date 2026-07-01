import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';

interface FlowObservableNodeLayerWidgetProxyResult {
  getNode: () => HTMLElement | null;
  getType: () => HTMLElement | null;
  getDescription: () => HTMLElement | null;
}

export const FlowObservableNodeLayerWidgetProxy = (): FlowObservableNodeLayerWidgetProxyResult => {
  xyflowNodeHandlesAdapterProxy();

  return {
    getNode: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE'),
    getType: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_TYPE'),
    getDescription: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_DESC'),
  };
};
