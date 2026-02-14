import { screen } from '@testing-library/react';

import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

const EXPECTED_SPRITE_COUNT = 2;

export const LogoWidgetProxy = (): {
  hasAsciiLogo: () => boolean;
  hasTwoSprites: () => boolean;
  hasLogoGroup: () => boolean;
} => {
  PixelSpriteWidgetProxy();

  return {
    hasAsciiLogo: (): boolean => screen.queryByTestId('LOGO_ASCII') !== null,
    hasTwoSprites: (): boolean =>
      screen.getAllByTestId('PIXEL_SPRITE').length === EXPECTED_SPRITE_COUNT,
    hasLogoGroup: (): boolean => screen.queryByTestId('LOGO_GROUP') !== null,
  };
};
