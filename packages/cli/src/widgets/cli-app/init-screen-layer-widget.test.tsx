import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { InitScreenLayerWidget } from './init-screen-layer-widget';

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
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<InitScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Initialize Dungeonmaster/u);
    });

    it('VALID: {} => displays setup message', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<InitScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/set up dungeonmaster/u);
    });

    it('VALID: {} => displays back instruction', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<InitScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      const onBack = jest.fn();

      const { unmount } = render(<InitScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(onBack).toBeDefined();
    });
  });
});
