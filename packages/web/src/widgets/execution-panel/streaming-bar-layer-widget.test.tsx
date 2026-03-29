import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { StreamingBarLayerWidget } from './streaming-bar-layer-widget';
import { StreamingBarLayerWidgetProxy } from './streaming-bar-layer-widget.proxy';

describe('StreamingBarLayerWidget', () => {
  describe('content', () => {
    it('VALID: {no props} => renders streaming text with block characters', () => {
      StreamingBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <StreamingBarLayerWidget />,
      });

      const bar = screen.getByTestId('streaming-bar-layer-widget');

      expect(bar.textContent).toContain('streaming...');
    });
  });

  describe('styling', () => {
    it('VALID: {no props} => renders with flex layout', () => {
      StreamingBarLayerWidgetProxy();

      mantineRenderAdapter({
        ui: <StreamingBarLayerWidget />,
      });

      const bar = screen.getByTestId('streaming-bar-layer-widget');

      expect([bar.style.display, bar.style.alignItems]).toStrictEqual(['flex', 'center']);
    });
  });
});
