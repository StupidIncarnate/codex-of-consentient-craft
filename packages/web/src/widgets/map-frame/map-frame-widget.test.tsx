import { screen } from '@testing-library/react';

import { CssPixelsStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { MapFrameWidget } from './map-frame-widget';
import { MapFrameWidgetProxy } from './map-frame-widget.proxy';

describe('MapFrameWidget', () => {
  describe('rendering', () => {
    it('VALID: {children} => renders children inside frame', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span data-testid="CHILD">Hello</span>
          </MapFrameWidget>
        ),
      });

      expect(screen.getByTestId('CHILD').textContent).toBe('Hello');
      expect(screen.getByTestId('MAP_FRAME')).toBeInTheDocument();
    });

    it('VALID: {default props} => renders all four corner decorations', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      expect(screen.getByTestId('CORNER_TOP_LEFT').textContent).toBe('\u250C\u2500\u2500');
      expect(screen.getByTestId('CORNER_TOP_RIGHT').textContent).toBe('\u2500\u2500\u2510');
      expect(screen.getByTestId('CORNER_BOTTOM_LEFT').textContent).toBe('\u2514\u2500\u2500');
      expect(screen.getByTestId('CORNER_BOTTOM_RIGHT').textContent).toBe('\u2500\u2500\u2518');
    });

    it('VALID: {default props} => applies border styling from theme', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const frame = screen.getByTestId('MAP_FRAME');

      expect([
        frame.style.border,

        frame.style.borderRadius,

        frame.style.padding,

        frame.style.position,
      ]).toStrictEqual(['2px solid rgb(61, 42, 30)', '2px', '16px', 'relative']);
    });

    it('VALID: {default props} => uses minHeight 0 and default maxWidth', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const frame = screen.getByTestId('MAP_FRAME');

      expect([frame.style.minHeight, frame.style.maxWidth, frame.style.width]).toStrictEqual([
        '0',

        '740px',

        '100%',
      ]);
    });

    it('VALID: {custom maxWidth} => overrides default', () => {
      MapFrameWidgetProxy();

      const maxWidth = CssPixelsStub({ value: 900 });

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget maxWidth={maxWidth}>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const frame = screen.getByTestId('MAP_FRAME');

      expect(frame.style.maxWidth).toBe('900px');
    });

    it('VALID: {custom padding} => overrides default', () => {
      MapFrameWidgetProxy();

      const padding = CssPixelsStub({ value: 32 });

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget padding={padding}>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const frame = screen.getByTestId('MAP_FRAME');

      expect(frame.style.padding).toBe('32px');
    });

    it('VALID: {top corners} => positions top-left and top-right absolutely', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const topLeft = screen.getByTestId('CORNER_TOP_LEFT');

      expect([topLeft.style.position, topLeft.style.top, topLeft.style.left]).toStrictEqual([
        'absolute',

        '-1px',

        '8px',
      ]);

      const topRight = screen.getByTestId('CORNER_TOP_RIGHT');

      expect([topRight.style.position, topRight.style.top]).toStrictEqual(['absolute', '-1px']);
    });

    it('VALID: {bottom corners} => positions bottom-left and bottom-right absolutely', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const topRight = screen.getByTestId('CORNER_TOP_RIGHT');

      expect(topRight.style.right).toBe('8px');

      const bottomLeft = screen.getByTestId('CORNER_BOTTOM_LEFT');

      expect([
        bottomLeft.style.position,

        bottomLeft.style.bottom,

        bottomLeft.style.left,
      ]).toStrictEqual(['absolute', '-1px', '8px']);

      const bottomRight = screen.getByTestId('CORNER_BOTTOM_RIGHT');

      expect(bottomRight.style.position).toBe('absolute');
    });

    it('VALID: {bottom-right corner} => positions at bottom-right', () => {
      MapFrameWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <MapFrameWidget>
            <span>content</span>
          </MapFrameWidget>
        ),
      });

      const bottomRight = screen.getByTestId('CORNER_BOTTOM_RIGHT');

      expect([bottomRight.style.bottom, bottomRight.style.right]).toStrictEqual(['-1px', '8px']);
    });
  });
});
