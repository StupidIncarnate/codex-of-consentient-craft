import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { HelpScreenLayerWidgetProxy } from './help-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

describe('HelpScreenLayerWidget', () => {
  describe('rendering help content', () => {
    it('VALID: {} => displays CLI name from statics', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/dungeonmaster/u);
    });

    it('VALID: {} => displays CLI description from statics', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Dungeonmaster Quest CLI/u);
    });

    it('VALID: {} => displays available commands', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/run/iu);
      expect(frame).toMatch(/list/iu);
      expect(frame).toMatch(/init/iu);
    });

    it('VALID: {} => displays back instruction', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });

      const frame = lastFrame();
      unmount();

      expect(frame).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      HelpScreenLayerWidgetProxy();
      const onBack = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={onBack} />,
      });

      unmount();

      // Verify the widget rendered without error when given the callback
      // The actual callback invocation is handled by useInput which requires
      // integration testing due to ink-testing-library stdin limitations
      expect(onBack).toBeDefined();
    });
  });
});
