import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PixelBtnWidgetProxy } from '../pixel-btn/pixel-btn-widget.proxy';
import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

export const HealthErrorLayerWidgetProxy = (): {
  getStatusText: () => HTMLElement['textContent'];
  getDetailText: () => HTMLElement['textContent'];
  hasSadRaccoon: () => boolean;
  getRetryLabel: () => HTMLElement['textContent'];
  clickRetry: () => Promise<void>;
} => {
  PixelSpriteWidgetProxy();
  PixelBtnWidgetProxy();

  return {
    getStatusText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HEALTH_PAGE_ERROR_STATUS')?.textContent ?? null,
    getDetailText: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HEALTH_PAGE_ERROR_DETAIL')?.textContent ?? null,
    hasSadRaccoon: (): boolean => screen.queryByTestId('HEALTH_PAGE_SAD_RACCOON') !== null,
    getRetryLabel: (): HTMLElement['textContent'] =>
      screen.queryByTestId('HEALTH_PAGE_RETRY')?.textContent ?? null,
    clickRetry: async (): Promise<void> => {
      const retry = screen.getByTestId('HEALTH_PAGE_RETRY');
      await userEvent.click(within(retry).getByTestId('PIXEL_BTN'));
    },
  };
};
