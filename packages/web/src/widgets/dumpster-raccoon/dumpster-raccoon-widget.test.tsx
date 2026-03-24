import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { DumpsterRaccoonWidget } from './dumpster-raccoon-widget';
import { DumpsterRaccoonWidgetProxy } from './dumpster-raccoon-widget.proxy';

describe('DumpsterRaccoonWidget', () => {
  describe('rendering', () => {
    it('VALID: {default} => renders widget container with test id', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget />,
      });

      expect(screen.getByTestId('dumpster-raccoon-widget')).toBeInTheDocument();
    });

    it('VALID: {default} => renders raccoon and fire pixel sprites', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget />,
      });

      const sprites = screen.getAllByTestId('PIXEL_SPRITE');

      expect(sprites.map((s) => s.getAttribute('data-testid'))).toStrictEqual([
        'PIXEL_SPRITE',
        'PIXEL_SPRITE',
      ]);
    });

    it('VALID: {default} => renders loading text', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget />,
      });

      expect(screen.getByText('Loading dumpster dungeon visuals...')).toBeInTheDocument();
    });
  });
});
