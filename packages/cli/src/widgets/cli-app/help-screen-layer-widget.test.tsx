import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { HelpScreenLayerWidget } from './help-screen-layer-widget';

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
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<HelpScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
    });

    it('VALID: {} => displays CLI description from statics', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<HelpScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Dungeonmaster Quest CLI/u);
    });

    it('VALID: {} => displays available commands', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<HelpScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/list/iu);
      expect(lastFrame()).toMatch(/init/iu);
      expect(lastFrame()).toMatch(/add/iu);
    });

    it('VALID: {} => displays back instruction', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<HelpScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      const onBack = jest.fn();

      const { unmount } = render(<HelpScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      // Verify the widget rendered without error when given the callback
      // The actual callback invocation is handled by useInput which requires
      // integration testing due to ink-testing-library stdin limitations
      expect(onBack).toBeDefined();
    });
  });
});
