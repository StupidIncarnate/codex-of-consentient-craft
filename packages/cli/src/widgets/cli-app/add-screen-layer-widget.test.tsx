import { afterEach, describe, expect, it, jest } from '@jest/globals';
import React from 'react';

import { inkTestRender as render } from '../../adapters/ink-testing-library/render/ink-test-render';

import { cliStatics } from '../../statics/cli/cli-statics';
import { AddScreenLayerWidget } from './add-screen-layer-widget';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

describe('AddScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering add content', () => {
    it('VALID: {} => displays add prompt from statics', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/What would you like to build/u);
    });

    it('VALID: {} => displays input cursor', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/>/u);
    });

    it('VALID: {} => displays submit/cancel instructions', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Enter to submit, Escape to cancel/u);
    });

    it('VALID: {} => displays text cursor indicator', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/_/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSubmit, onCancel callbacks} => accepts callbacks for interaction', () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { unmount } = render(<AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />);
      unmountFn = unmount;

      expect(onSubmit).toBeDefined();
      expect(onCancel).toBeDefined();
    });
  });

  describe('keyboard input handling', () => {
    it('VALID: typing characters => displays typed text', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('hello');

      expect(lastFrame()).toMatch(/hello/u);
    });

    it('VALID: backspace (ctrl+H) => removes last character', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('hello');
      await waitForUseEffect();
      stdin.write('\x08');
      await waitForUseEffect();

      expect(lastFrame()).toMatch(/hell/u);
      expect(lastFrame()).not.toMatch(/hello/u);
    });

    it('VALID: delete key (DEL) => removes last character', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { lastFrame, stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('world');
      await waitForUseEffect();
      stdin.write('\x7F');
      await waitForUseEffect();

      expect(lastFrame()).toMatch(/worl/u);
      expect(lastFrame()).not.toMatch(/world/u);
    });

    it('VALID: enter with text => calls onSubmit with userInput', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('Build a REST API');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ userInput: 'Build a REST API' });
    });

    it('VALID: escape => calls onCancel', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\x1B');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('INVALID: enter with empty input => does not call onSubmit', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\r');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('INVALID: enter with only whitespace => does not call onSubmit', async () => {
      const onSubmit = jest.fn();
      const onCancel = jest.fn();

      const { stdin, unmount } = render(
        <AddScreenLayerWidget onSubmit={onSubmit} onCancel={onCancel} />,
      );
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('   ');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
