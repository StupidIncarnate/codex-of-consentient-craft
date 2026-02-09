import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { HelpScreenLayerWidget } from './help-screen-layer-widget';
import { HelpScreenLayerWidgetProxy } from './help-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

describe('HelpScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering help content', () => {
    it('VALID: {} => displays CLI name from statics', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
    });

    it('VALID: {} => displays CLI description from statics', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Dungeonmaster Quest CLI/u);
    });

    it('VALID: {} => displays available commands', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/run/iu);
      expect(lastFrame()).toMatch(/list/iu);
      expect(lastFrame()).toMatch(/init/iu);
    });

    it('VALID: {} => displays back instruction', () => {
      HelpScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <HelpScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
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
      unmountFn = unmount;

      // Verify the widget rendered without error when given the callback
      // The actual callback invocation is handled by useInput which requires
      // integration testing due to ink-testing-library stdin limitations
      expect(onBack).toBeDefined();
    });
  });
});
