import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { StreamingIndicatorWidget } from './streaming-indicator-widget';
import { StreamingIndicatorWidgetProxy } from './streaming-indicator-widget.proxy';

describe('StreamingIndicatorWidget', () => {
  describe('rendering', () => {
    it('VALID: {isSubagent: false} => renders container with orange chaos accent border', () => {
      StreamingIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <StreamingIndicatorWidget isSubagent={false} /> });

      const container = screen.getByTestId('STREAMING_INDICATOR');

      expect(container.style.borderLeft).toBe('3px solid rgb(255, 107, 53)');
    });

    it('VALID: {isSubagent: true} => renders container with purple sub-agent accent border', () => {
      StreamingIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <StreamingIndicatorWidget isSubagent={true} /> });

      const container = screen.getByTestId('STREAMING_INDICATOR');

      expect(container.style.borderLeft).toBe('3px solid rgb(232, 121, 249)');
    });

    it('VALID: {} => renders indicator text starting with a sparkle glyph', () => {
      StreamingIndicatorWidgetProxy();

      mantineRenderAdapter({ ui: <StreamingIndicatorWidget isSubagent={false} /> });

      const text = screen.getByTestId('STREAMING_INDICATOR_TEXT');

      expect(text.textContent?.startsWith('\u2726')).toBe(true);
    });
  });
});
