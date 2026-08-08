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

      expect(screen.getByTestId('DUMPSTER_RACCOON_LOADING')).toBeInTheDocument();
    });

    it('VALID: {default} => fills its parent on the panel surface', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget />,
      });

      const box = screen.getByTestId('dumpster-raccoon-widget');

      expect({ flex: box.style.flex, background: box.style.backgroundColor }).toStrictEqual({
        flex: '1 1 0%',
        background: 'rgb(26, 17, 13)',
      });
    });
  });

  describe('ornament', () => {
    // Stacked above the summary, a bg-surface fill is what fused the two into one box. The
    // background is asserted as transparent for that reason, not as incidental styling.
    it('VALID: {ornament} => sizes to its sprites and paints no surface of its own', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget ornament={true} />,
      });

      const box = screen.getByTestId('dumpster-raccoon-widget');

      expect({ flex: box.style.flex, background: box.style.backgroundColor }).toStrictEqual({
        flex: '0 0 auto',
        background: 'transparent',
      });
    });

    it('VALID: {ornament} => drops the loading caption, because nothing is loading', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget ornament={true} />,
      });

      expect(screen.queryByTestId('DUMPSTER_RACCOON_LOADING')).toBe(null);
    });

    it('VALID: {ornament} => still renders both sprites', () => {
      DumpsterRaccoonWidgetProxy();

      mantineRenderAdapter({
        ui: <DumpsterRaccoonWidget ornament={true} />,
      });

      const sprites = screen.getAllByTestId('PIXEL_SPRITE');

      expect(sprites.map((s) => s.getAttribute('data-testid'))).toStrictEqual([
        'PIXEL_SPRITE',
        'PIXEL_SPRITE',
      ]);
    });
  });
});
