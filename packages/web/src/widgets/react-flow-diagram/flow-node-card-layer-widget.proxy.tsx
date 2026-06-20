import { screen } from '@testing-library/react';

interface FlowNodeCardLayerWidgetProxyResult {
  getNodeCard: () => HTMLElement | null;
  getTypeIcon: () => HTMLElement | null;
  getBadge: () => HTMLElement | null;
  getAccentStyle: () => HTMLElement['style'] | null;
  isSelected: () => boolean;
}

export const FlowNodeCardLayerWidgetProxy = (): FlowNodeCardLayerWidgetProxyResult => ({
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
});
