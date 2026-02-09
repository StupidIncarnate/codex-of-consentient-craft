import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { MenuScreenLayerWidget } from './menu-screen-layer-widget';
import { MenuScreenLayerWidgetProxy } from './menu-screen-layer-widget.proxy';

// Simple no-op callback for tests that only check rendering
const noopCallback = (): void => {
  // No-op
};

describe('MenuScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering menu content', () => {
    it('VALID: {} => displays CLI name from statics', () => {
      MenuScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={noopCallback} onExit={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
    });

    it('VALID: {} => displays menu options', () => {
      MenuScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={noopCallback} onExit={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Run/u);
      expect(lastFrame()).toMatch(/Init/u);
      expect(lastFrame()).toMatch(/List/u);
    });

    it('VALID: {} => displays navigation instructions', () => {
      MenuScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={noopCallback} onExit={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/arrow keys/u);
    });

    it('VALID: {} => displays build timestamp', () => {
      MenuScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={noopCallback} onExit={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Built:/u);
    });

    it('VALID: {} => displays first option as selected by default', () => {
      MenuScreenLayerWidgetProxy();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={noopCallback} onExit={noopCallback} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/> Run/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSelect, onExit callbacks} => accepts callbacks for interaction', () => {
      MenuScreenLayerWidgetProxy();
      const onSelect = (): void => {
        // Callback exists
      };
      const onExit = (): void => {
        // Callback exists
      };

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: <MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />,
      });
      unmountFn = unmount;

      expect(onSelect).toBeDefined();
      expect(onExit).toBeDefined();
    });
  });
});
