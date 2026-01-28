import React from 'react';

import { inkTestingLibraryRenderAdapter } from '../../adapters/ink-testing-library/render/ink-testing-library-render-adapter';

import { cliStatics } from '../../statics/cli/cli-statics';
import { SignalQuestionStub } from '../../contracts/signal-question/signal-question.stub';
import { SignalContextStub } from '../../contracts/signal-context/signal-context.stub';
import { AnswerScreenLayerWidget } from './answer-screen-layer-widget';
import { AnswerScreenLayerWidgetProxy } from './answer-screen-layer-widget.proxy';

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

describe('AnswerScreenLayerWidget', () => {
  let unmountFn: (() => void) | null = null;

  afterEach(() => {
    if (unmountFn) {
      unmountFn();
      unmountFn = null;
    }
  });

  describe('rendering answer content', () => {
    it('VALID: {question, context} => displays question', () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub({ value: 'What port number?' });
      const context = SignalContextStub({ value: 'Setting up server' });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/What port number\?/u);
    });

    it('VALID: {question, context} => displays context', () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub({ value: 'What port number?' });
      const context = SignalContextStub({ value: 'Setting up server' });

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Setting up server/u);
    });

    it('VALID: {} => displays input cursor', () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/>/u);
    });

    it('VALID: {} => displays submit/cancel instructions', () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { lastFrame, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      expect(lastFrame()).toMatch(/Press Enter to submit, Escape to cancel/u);
    });
  });

  describe('keyboard input handling', () => {
    it('VALID: typing characters => displays typed text', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { lastFrame, stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('4000');

      expect(lastFrame()).toMatch(/4000/u);
    });

    it('VALID: backspace => removes last character', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { lastFrame, stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('4000');
      await waitForUseEffect();
      stdin.write('\x08');
      await waitForUseEffect();

      expect(lastFrame()).toMatch(/400/u);
      expect(lastFrame()).not.toMatch(/4000/u);
    });

    it('VALID: enter with text => calls onSubmit with answer', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('Port 4000');
      await waitForUseEffect();
      stdin.write('\r');
      await waitForUseEffect();

      expect(onSubmit.calls.length).toBe(1);
      expect(onSubmit.lastCallArgs()).toStrictEqual([{ answer: 'Port 4000' }]);
    });

    it('VALID: escape => calls onCancel', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\x1B');

      expect(onCancel.calls.length).toBe(1);
    });

    it('INVALID: enter with empty input => does not call onSubmit', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
      });
      unmountFn = unmount;

      await waitForUseEffect();
      stdin.write('\r');

      expect(onSubmit.wasCalled()).toBe(false);
    });

    it('INVALID: enter with only whitespace => does not call onSubmit', async () => {
      AnswerScreenLayerWidgetProxy();
      const onSubmit = createTrackableCallback();
      const onCancel = createTrackableCallback();
      const question = SignalQuestionStub();
      const context = SignalContextStub();

      const { stdin, unmount } = inkTestingLibraryRenderAdapter({
        element: (
          <AnswerScreenLayerWidget
            question={question}
            context={context}
            onSubmit={onSubmit.fn}
            onCancel={onCancel.fn}
          />
        ),
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
