import { screen } from '#gateway/npm/testing-library__react';

import { mantineRenderMiddleware } from '@dungeonmaster/testing/middleware/mantine-render';
import { LogoWidget } from './logo-widget';
import { LogoWidgetProxy } from './logo-widget.proxy';

describe('LogoWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders ASCII logo text', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      expect(proxy.hasAsciiLogo()).toBe(true);
    });

    it('VALID: {} => renders two pixel sprites for fireball icons', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      expect(proxy.hasTwoSprites()).toBe(true);
    });

    it('VALID: {} => renders logo group container', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      expect(proxy.hasLogoGroup()).toBe(true);
    });

    it('VALID: {} => renders ASCII pre element with primary color', () => {
      LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.color).toBe('rgb(255, 107, 53)');
    });

    it('VALID: {} => renders ASCII pre element with 7px font size', () => {
      LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.fontSize).toBe('7px');
    });

    it('VALID: {} => renders ASCII pre element with monospace font', () => {
      LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.fontFamily).toBe('monospace');
    });
  });

  describe('narrow viewport', () => {
    it('VALID: {} => the sprites sit in hideable slots and the group never wraps', () => {
      LogoWidgetProxy();

      mantineRenderMiddleware({ ui: <LogoWidget /> });

      const slots = screen.getAllByTestId('LOGO_SPRITE_SLOT');

      expect(slots.map((slot) => slot.className)).toStrictEqual(['logo-sprite', 'logo-sprite']);
      expect(screen.getByTestId('LOGO_GROUP').style.getPropertyValue('--group-wrap')).toBe(
        'nowrap',
      );
      expect(screen.getByTestId('LOGO_ASCII').className).toBe('logo-ascii');
    });
  });
});
