import { screen } from '@testing-library/react';

import { xyflowNodeHandlesAdapterProxy } from '../../adapters/xyflow/node-handles/xyflow-node-handles-adapter.proxy';
import { CommentPopoverWidgetProxy } from '../comment-popover/comment-popover-widget.proxy';

interface FlowObservableNodeLayerWidgetProxyResult {
  getNode: () => HTMLElement | null;
  getType: () => HTMLElement | null;
  getDescription: () => HTMLElement | null;
  getCommentBadge: () => HTMLElement | null;
  setupEmptyQueue: () => void;
  countCommentButtons: () => HTMLElement['childElementCount'];
  getPackage: () => HTMLElement | null;
  getPackageColor: () => HTMLElement['textContent'];
  getPackageType: () => HTMLElement['textContent'];
  packageSharesRowWithType: () => boolean;
  getReadCheck: () => HTMLElement | null;
  readCheckSharesRowWithType: () => boolean;
}

export const FlowObservableNodeLayerWidgetProxy = (): FlowObservableNodeLayerWidgetProxyResult => {
  xyflowNodeHandlesAdapterProxy();
  const commentProxy = CommentPopoverWidgetProxy();

  return {
    getNode: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE'),
    getType: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_TYPE'),
    getDescription: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_DESC'),
    getCommentBadge: (): HTMLElement | null => screen.queryByTestId('COMMENT_COUNT_BADGE'),
    getPackage: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_PACKAGE'),
    // The palette token the chip resolved for its package's KIND, read off `data-package-accent`
    // rather than the applied CSS: jsdom rewrites a hex to `rgb(...)`, so a style read would be
    // comparing two notations of the same colour.
    getPackageColor: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_OBSERVABLE_NODE_PACKAGE')?.getAttribute('data-package-accent') ??
      null,
    getPackageType: (): HTMLElement['textContent'] =>
      screen.queryByTestId('FLOW_OBSERVABLE_NODE_PACKAGE')?.getAttribute('data-package-type') ??
      null,
    // Both tags must be children of the SAME element, because the card's reserved ELK height counts
    // one tag row: a package chip that fell onto a row of its own grows the card past the box ELK
    // laid out for it and the column below overlaps.
    packageSharesRowWithType: (): boolean => {
      const packageChip = screen.queryByTestId('FLOW_OBSERVABLE_NODE_PACKAGE');
      const typeTag = screen.queryByTestId('FLOW_OBSERVABLE_NODE_TYPE');
      return (
        packageChip !== null &&
        typeTag !== null &&
        packageChip.parentElement !== null &&
        packageChip.parentElement === typeTag.parentElement
      );
    },
    getReadCheck: (): HTMLElement | null => screen.queryByTestId('FLOW_OBSERVABLE_NODE_READ_CHECK'),
    // Same reason as `packageSharesRowWithType`: the ELK box reserves ONE tag row, so a third chip
    // that wrapped onto its own row would grow the card past the space laid out for it.
    readCheckSharesRowWithType: (): boolean => {
      const readCheck = screen.queryByTestId('FLOW_OBSERVABLE_NODE_READ_CHECK');
      const typeTag = screen.queryByTestId('FLOW_OBSERVABLE_NODE_TYPE');
      return (
        readCheck !== null &&
        typeTag !== null &&
        readCheck.parentElement !== null &&
        readCheck.parentElement === typeTag.parentElement
      );
    },
    setupEmptyQueue: (): void => {
      commentProxy.setupEmptyQueue();
    },
    countCommentButtons: (): HTMLElement['childElementCount'] => commentProxy.countCommentButtons(),
  };
};
