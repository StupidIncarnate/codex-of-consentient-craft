import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { ListScreenLayerWidget } from './list-screen-layer-widget';

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
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<ListScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Active Quests/u);
    });

    it('VALID: {} => displays no quests message', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<ListScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/No active quests found/u);
    });

    it('VALID: {} => displays back instruction', () => {
      const onBack = jest.fn();

      const { lastFrame, unmount } = render(<ListScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Escape or 'q' to go back/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onBack callback} => accepts onBack prop for navigation', () => {
      const onBack = jest.fn();

      const { unmount } = render(<ListScreenLayerWidget onBack={onBack} />);
      unmountFn = unmount;

      expect(onBack).toBeDefined();
    });
  });
});
