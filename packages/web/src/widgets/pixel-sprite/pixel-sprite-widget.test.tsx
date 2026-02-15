import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { PixelCoordinateStub } from '../../contracts/pixel-coordinate/pixel-coordinate.stub';
import { PixelDimensionStub } from '../../contracts/pixel-dimension/pixel-dimension.stub';
import { PixelSpriteWidget } from './pixel-sprite-widget';
import { PixelSpriteWidgetProxy } from './pixel-sprite-widget.proxy';

describe('PixelSpriteWidget', () => {
  describe('rendering', () => {
    it('VALID: {single pixel} => renders div with box-shadow', () => {
      PixelSpriteWidgetProxy();

      const pixels = [PixelCoordinateStub({ value: '2 3 #ff4500' })] as const;
      const scale = PixelDimensionStub({ value: 4 });
      const width = PixelDimensionStub({ value: 8 });
      const height = PixelDimensionStub({ value: 20 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      expect(sprite.style.boxShadow).toBe('8px 12px 0 0 #ff4500');
      expect(sprite.style.width).toBe('4px');
      expect(sprite.style.height).toBe('4px');
    });

    it('VALID: {multiple pixels} => renders comma-separated box-shadows', () => {
      PixelSpriteWidgetProxy();

      const pixels = [
        PixelCoordinateStub({ value: '0 0 #ff0000' }),
        PixelCoordinateStub({ value: '1 1 #00ff00' }),
      ] as const;
      const scale = PixelDimensionStub({ value: 2 });
      const width = PixelDimensionStub({ value: 4 });
      const height = PixelDimensionStub({ value: 4 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      expect(sprite.style.boxShadow).toBe('0px 0px 0 0 #ff0000,2px 2px 0 0 #00ff00');
    });

    it('VALID: {flip: true} => mirrors x coordinates', () => {
      PixelSpriteWidgetProxy();

      const pixels = [PixelCoordinateStub({ value: '2 0 #ff4500' })] as const;
      const scale = PixelDimensionStub({ value: 4 });
      const width = PixelDimensionStub({ value: 8 });
      const height = PixelDimensionStub({ value: 20 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} flip />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      // flip: (width - 1 - x) * scale = (8 - 1 - 2) * 4 = 20
      expect(sprite.style.boxShadow).toBe('20px 0px 0 0 #ff4500');
      expect(sprite.style.transform).toBe('scaleX(-1)');
    });

    it('VALID: {flip: false} => uses normal margins', () => {
      PixelSpriteWidgetProxy();

      const pixels = [PixelCoordinateStub({ value: '0 0 #ff4500' })] as const;
      const scale = PixelDimensionStub({ value: 4 });
      const width = PixelDimensionStub({ value: 8 });
      const height = PixelDimensionStub({ value: 20 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      expect(sprite.style.marginRight).toBe('28px');
      expect(sprite.style.marginLeft).toBe('0px');
      expect(sprite.style.marginBottom).toBe('76px');
    });

    it('VALID: {flip: true} => uses flipped margins', () => {
      PixelSpriteWidgetProxy();

      const pixels = [PixelCoordinateStub({ value: '0 0 #ff4500' })] as const;
      const scale = PixelDimensionStub({ value: 4 });
      const width = PixelDimensionStub({ value: 8 });
      const height = PixelDimensionStub({ value: 20 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} flip />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      expect(sprite.style.marginRight).toBe('0px');
      expect(sprite.style.marginLeft).toBe('28px');
    });

    it('EMPTY: {pixels: []} => renders div with empty box-shadow', () => {
      PixelSpriteWidgetProxy();

      const pixels: readonly ReturnType<typeof PixelCoordinateStub>[] = [];
      const scale = PixelDimensionStub({ value: 4 });
      const width = PixelDimensionStub({ value: 8 });
      const height = PixelDimensionStub({ value: 20 });

      mantineRenderAdapter({
        ui: <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} />,
      });

      const sprite = screen.getByTestId('PIXEL_SPRITE');

      expect(sprite.style.boxShadow).toBe('');
    });
  });
});
