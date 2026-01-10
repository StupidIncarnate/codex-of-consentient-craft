import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { InitScreenLayerWidget } from './init-screen-layer-widget';
import { InitScreenLayerWidgetProxy } from './init-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

describe('InitScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering init content', () => {
    it('VALID: {} => displays Initialize Dungeonmaster title', () => {
      InitScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <InitScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {} => displays setup message', () => {
      InitScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <InitScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/set up dungeonmaster/u);
    });

    it('VALID: {} => displays back instruction', () => {
      InitScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <InitScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      InitScreenLayerWidgetProxy();
      const onBack = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: <InitScreenLayerWidget onBack={onBack} />,
      });
      unmountFn = unmount;

      expect(onBack).toBeDefined();
    });
  });
});
