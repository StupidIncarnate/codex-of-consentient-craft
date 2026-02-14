import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { LogoWidget } from './logo-widget';
import { LogoWidgetProxy } from './logo-widget.proxy';

describe('LogoWidget', () => {
  describe('rendering', () => {
    it('VALID: {} => renders ASCII logo text', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      expect(proxy.hasAsciiLogo()).toBe(true);
    });

    it('VALID: {} => renders two pixel sprites for fireball icons', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      expect(proxy.hasTwoSprites()).toBe(true);
    });

    it('VALID: {} => renders logo group container', () => {
      const proxy = LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      expect(proxy.hasLogoGroup()).toBe(true);
    });

    it('VALID: {} => renders ASCII pre element with primary color', () => {
      LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.color).toBe('rgb(255, 107, 53)');
    });

    it('VALID: {} => renders ASCII pre element with 7px font size', () => {
      LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.fontSize).toBe('7px');
    });

    it('VALID: {} => renders ASCII pre element with monospace font', () => {
      LogoWidgetProxy();

      mantineRenderAdapter({ ui: <LogoWidget /> });

      const pre = screen.getByTestId('LOGO_ASCII');

      expect(pre.style.fontFamily).toBe('monospace');
    });
  });
});
