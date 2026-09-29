import { clearIntervalProxy } from '#gateway/browser/clearInterval/clear-interval/clear-interval.proxy';
import { setIntervalProxy } from '#gateway/browser/setInterval/set-interval/set-interval.proxy';

import { PixelSpriteWidgetProxy } from '../pixel-sprite/pixel-sprite-widget.proxy';

export const DumpsterRaccoonWidgetProxy = (): Record<PropertyKey, never> => {
  PixelSpriteWidgetProxy();
  // Both pass through: the sprite's real animation intervals run and are really cleared.
  setIntervalProxy();
  clearIntervalProxy();
  return {};
};
