/**
 * PURPOSE: Test proxy for DesignPanelWidget - provides test helpers for design panel assertions
 *
 * USAGE:
 * const proxy = DesignPanelWidgetProxy();
 * proxy.hasPlaceholder();
 */

import { screen } from '@testing-library/react';

export const DesignPanelWidgetProxy = (): {
  hasPlaceholder: () => boolean;
  hasIframe: () => boolean;
  getIframeSrc: () => HTMLElement['textContent'];
} => ({
  hasPlaceholder: (): boolean => screen.queryByTestId('DESIGN_PANEL_PLACEHOLDER') !== null,
  hasIframe: (): boolean => screen.queryByTestId('DESIGN_IFRAME') !== null,
  getIframeSrc: (): HTMLElement['textContent'] => {
    const iframe = screen.queryByTestId('DESIGN_IFRAME');
    return iframe?.getAttribute('src') ?? null;
  },
});
