import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';
import { CommentPopoverWidgetProxy } from '../comment-popover/comment-popover-widget.proxy';

interface FlowNodeCardLayerWidgetProxyResult {
  getNodeCard: () => HTMLElement | null;
  getTypeIcon: () => HTMLElement | null;
  getBadge: () => HTMLElement | null;
  getCommentBadge: () => HTMLElement | null;
  getAccentStyle: () => HTMLElement['style'] | null;
  isSelected: () => boolean;
  setupEmptyQueue: () => void;
  countCommentButtons: () => HTMLElement['childElementCount'];
  getPackageChipNames: () => HTMLElement['textContent'][];
  getPackageChipColors: () => HTMLElement['textContent'][];
  getPackageChipTypes: () => HTMLElement['textContent'][];
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
    // The contracts badge — kept meaning ONLY the contracts count so a test can never confuse it
    // with the comment count badge below.
    getBadge: (): HTMLElement | null => screen.queryByTestId('FLOW_NODE_BADGE'),
    getCommentBadge: (): HTMLElement | null => screen.queryByTestId('COMMENT_COUNT_BADGE'),
    // Read from INSIDE the FLOW_NODE_PACKAGES row rather than by chip testid alone, so a chip that
    // escaped the row (and therefore the height ELK reserved for it) is not counted as rendered.
    getPackageChipNames: (): HTMLElement['textContent'][] =>
      Array.from(
        screen
          .queryByTestId('FLOW_NODE_PACKAGES')
          ?.querySelectorAll('[data-testid="FLOW_NODE_PACKAGE_CHIP"]') ?? [],
      ).map((chip) => chip.textContent),
    // The palette token each chip resolved for its package's KIND, read off `data-package-accent`
    // rather than the applied CSS: jsdom rewrites a hex to `rgb(...)`, so a style read would be
    // comparing two notations of the same colour.
    getPackageChipColors: (): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId('FLOW_NODE_PACKAGE_CHIP')
        .map((chip) => chip.getAttribute('data-package-accent')),
    getPackageChipTypes: (): HTMLElement['textContent'][] =>
      screen
        .queryAllByTestId('FLOW_NODE_PACKAGE_CHIP')
        .map((chip) => chip.getAttribute('data-package-type')),
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
