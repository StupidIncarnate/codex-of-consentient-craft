import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { cliStatics } from '../../statics/cli/cli-statics';
import { AddScreenLayerWidget } from './add-screen-layer-widget';
import { AddScreenLayerWidgetProxy } from './add-screen-layer-widget.proxy';

const waitForUseEffect = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, cliStatics.testing.useEffectDelayMs);
  });
};

// Helper to create trackable callback functions for testing
const createTrackableCallback = (): {
  fn: (...args: unknown[]) => void;
  calls: unknown[][];
  wasCalled: () => boolean;
  lastCallArgs: () => unknown[] | undefined;
} => {
  const calls: unknown[][] = [];
  return {
    fn: (...args: unknown[]): void => {
      calls.push(args);
    },
    calls,
    wasCalled: (): boolean => calls.length > 0,
    lastCallArgs: (): unknown[] | undefined => calls[calls.length - 1],
  };
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
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/What would you like to build/u);
    });

    it('VALID: {} => displays input cursor', () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/>/u);
    });

    it('VALID: {} => displays submit/cancel instructions', () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Enter to submit, Escape to cancel/u);
    });

    it('VALID: {} => displays text cursor indicator', () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/_/u);
    });
  });

  describe('widget structure', () => {
    it('VALID: {onSubmit, onCancel callbacks} => accepts callbacks for interaction', () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      expect(onSubmit.fn).toBeDefined();
      expect(onCancel.fn).toBeDefined();
    });
  });

  describe('keyboard input handling', () => {
    it('VALID: typing characters => displays typed text', async () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('hello');

      expect(lastFrame()).toMatch(/hello/u);
    });

    it('VALID: backspace (ctrl+H) => removes last character', async () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
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
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { lastFrame, stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
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
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('Build a REST API');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      expect(onSubmit.calls.length).toBe(1);
      expect(onSubmit.lastCallArgs()).toStrictEqual([{ userInput: 'Build a REST API' }]);
    });

    it('VALID: escape => calls onCancel', async () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\x1B');

      expect(onCancel.calls.length).toBe(1);
    });

    it('INVALID: enter with empty input => does not call onSubmit', async () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\r');

      expect(onSubmit.wasCalled()).toBe(false);
    });

    it('INVALID: enter with only whitespace => does not call onSubmit', async () => {
      AddScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: <AddScreenLayerWidget onSubmit={onSubmit.fn} onCancel={onCancel.fn} />,
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('   ');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      expect(onSubmit.wasCalled()).toBe(false);
    });
  });
});
