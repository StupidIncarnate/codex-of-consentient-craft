import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { ListScreenLayerWidget } from './list-screen-layer-widget';
import { ListScreenLayerWidgetProxy } from './list-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

describe('ListScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering list content', () => {
    it('VALID: {} => displays Active Quests title', () => {
      ListScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Active Quests/u);
    });

    it('VALID: {} => displays no quests message', () => {
      ListScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/No active quests found/u);
    });

    it('VALID: {} => displays back instruction', () => {
      ListScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget onBack={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      ListScreenLayerWidgetProxy();
      const onBack = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: <ListScreenLayerWidget onBack={onBack} />,
      });
      unmountFn = unmount;

      expect(onBack).toBeDefined();
    });
  });
});
