import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';
import { CommentPopoverWidgetProxy } from '../comment-popover/comment-popover-widget.proxy';

interface FlowNodeCardLayerWidgetProxyResult {
  getNodeCard: () => HTMLElement | null;
  getTypeIcon: () => HTMLElement | null;
  getBadge: () => HTMLElement | null;
  getAccentStyle: () => HTMLElement['style'] | null;
  isSelected: () => boolean;
  setupEmptyQueue: () => void;
  countCommentButtons: () => HTMLElement['childElementCount'];
}

export const FlowNodeCardLayerWidgetProxy = (): FlowNodeCardLayerWidgetProxyResult => {
  xyflowNodeHandlesAdapterProxy();
  const commentProxy = CommentPopoverWidgetProxy();

  return {
    setupEmptyQueue: (): void => {
      commentProxy.setupEmptyQueue();
    },
    countCommentButtons: (): HTMLElement['childElementCount'] => commentProxy.countCommentButtons(),
    getNodeCard: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE'),
    getTypeIcon: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_TYPE_ICON'),
    getBadge: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_BADGE'),
    getAccentStyle: (): HTMLElement['style'] | null => {
      const card = screen.queryByTestId('FLOW_NODE');
      return card ? card.style : null;
    },
    isSelected: (): boolean => {
      const card = screen.queryByTestId('FLOW_NODE');
      return card?.getAttribute('data-selected') === 'true';
    },
  };
};
