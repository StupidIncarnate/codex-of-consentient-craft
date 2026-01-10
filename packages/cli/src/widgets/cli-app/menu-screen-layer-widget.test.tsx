import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { MenuScreenLayerWidget } from './menu-screen-layer-widget';

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
      const onSelect = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = render(
        <MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/dungeonmaster/u);
    });

    it('VALID: {} => displays menu options', () => {
      const onSelect = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = render(
        <MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Init/u);
      expect(lastFrame()).toMatch(/List/u);
      expect(lastFrame()).toMatch(/Add/u);
    });

    it('VALID: {} => displays navigation instructions', () => {
      const onSelect = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = render(
        <MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/arrow keys/u);
    });

    it('VALID: {} => displays first option as selected by default', () => {
      const onSelect = jest.fn();
      const onExit = jest.fn();

      const { lastFrame, unmount } = render(
        <MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/> Add/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSelect, onExit callbacks} => accepts callbacks for interaction', () => {
      const onSelect = jest.fn();
      const onExit = jest.fn();

      const { unmount } = render(<MenuScreenLayerWidget onSelect={onSelect} onExit={onExit} />);
      unmountFn = unmount;

      expect(onSelect).toBeDefined();
      expect(onExit).toBeDefined();
    });
  });
});
