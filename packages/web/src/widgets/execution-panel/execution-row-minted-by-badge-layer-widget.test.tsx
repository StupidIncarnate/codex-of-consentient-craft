import { render, screen } from '#gateway/npm/testing-library__react';

import { ExecutionRowMintedByBadgeLayerWidget } from './execution-row-minted-by-badge-layer-widget';
import { ExecutionRowMintedByBadgeLayerWidgetProxy } from './execution-row-minted-by-badge-layer-widget.proxy';

describe('ExecutionRowMintedByBadgeLayerWidget', () => {
  it('VALID: {mintedByLabel: "walk pt: 1"} => renders a badge naming the row it returns to', () => {
    ExecutionRowMintedByBadgeLayerWidgetProxy();

    render({
      ui: <ExecutionRowMintedByBadgeLayerWidget mintedByLabel={'walk pt: 1'} />,
    });

    const badge = screen.getByTestId('execution-row-minted-by-badge');

    expect(badge.textContent).toBe('↩ walk pt: 1');
  });

  it('EMPTY: {mintedByLabel: undefined} => renders nothing', () => {
    ExecutionRowMintedByBadgeLayerWidgetProxy();

    render({
      ui: <ExecutionRowMintedByBadgeLayerWidget mintedByLabel={undefined} />,
    });

    expect(screen.queryByTestId('execution-row-minted-by-badge')).toBe(null);
  });
});
