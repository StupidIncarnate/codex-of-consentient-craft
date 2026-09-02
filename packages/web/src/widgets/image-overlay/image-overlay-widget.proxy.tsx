import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';

export const ImageOverlayWidgetProxy = (): {
  hasOverlay: () => boolean;
  getImageSrc: () => HTMLImageElement['src'] | null;
  getImageAlt: () => HTMLImageElement['alt'] | null;
  getImageWidth: () => HTMLElement['style']['width'];
  getBodyMaxHeight: () => HTMLElement['style']['maxHeight'];
  getBodyOverflowY: () => HTMLElement['style']['overflowY'];
  clickClose: () => Promise<void>;
} => {
  IconButtonWidgetProxy();
  const user = userEvent.setup();

  return {
    hasOverlay: (): boolean => screen.queryByTestId('IMAGE_OVERLAY') !== null,
    // getAttribute (not the `.src`/`.alt` IDL properties) so a data URL and an http URL both come
    // back byte-for-byte what was passed — the IDL properties resolve `src` into an absolute URL,
    // which is exactly the normalization the composer/transcript equivalence test must not tolerate.
    getImageSrc: (): HTMLImageElement['src'] | null =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('src'),
    getImageAlt: (): HTMLImageElement['alt'] | null =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('alt'),
    getImageWidth: (): HTMLElement['style']['width'] =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').style.width,
    getBodyMaxHeight: (): HTMLElement['style']['maxHeight'] =>
      screen.getByTestId('IMAGE_OVERLAY').style.maxHeight,
    getBodyOverflowY: (): HTMLElement['style']['overflowY'] =>
      screen.getByTestId('IMAGE_OVERLAY').style.overflowY,
    clickClose: async (): Promise<void> => {
      await user.click(screen.getByTestId('IMAGE_OVERLAY_CLOSE'));
    },
  };
};
