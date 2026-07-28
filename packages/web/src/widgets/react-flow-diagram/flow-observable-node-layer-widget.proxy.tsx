import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';
import { CommentPopoverWidgetProxy } from '../comment-popover/comment-popover-widget.proxy';

interface FlowObservableNodeLayerWidgetProxyResult {
  getNode: () => HTMLElement | null;
  getType: () => HTMLElement | null;
  getDescription: () => HTMLElement | null;
  setupEmptyQueue: () => void;
  countCommentButtons: () => HTMLElement['childElementCount'];
}

export const FlowObservableNodeLayerWidgetProxy = (): FlowObservableNodeLayerWidgetProxyResult => {
  xyflowNodeHandlesAdapterProxy();
  const commentProxy = CommentPopoverWidgetProxy();

  return {
    getNode: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE'),
    getType: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_TYPE'),
    getDescription: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_DESC'),
    setupEmptyQueue: (): void => {
      commentProxy.setupEmptyQueue();
    },
    countCommentButtons: (): HTMLElement['childElementCount'] => commentProxy.countCommentButtons(),
  };
};
