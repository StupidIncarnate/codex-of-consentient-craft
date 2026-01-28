import { DebugCommandGetScreenStub } from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';
import { TerminalFrameStub } from '../../../contracts/terminal-frame/terminal-frame.stub';
import { CallbackKeyStub } from '../../../contracts/callback-key/callback-key.stub';

import { handleGetScreenLayerBroker } from './handle-get-screen-layer-broker';
import { handleGetScreenLayerBrokerProxy } from './handle-get-screen-layer-broker.proxy';

type CallbackKey = ReturnType<typeof CallbackKeyStub>;

describe('handleGetScreenLayerBroker', () => {
  describe('successful getScreen', () => {
    it('VALID: {renderResult with frame} => returns success with screen info', () => {
      handleGetScreenLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: '> Option 1\n  Option 2' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.name).toBe('CliAppWidget');
      expect(result.screen?.frame).toBe('> Option 1\n  Option 2');
      expect(result.screen?.elements).toStrictEqual([
        { type: 'menuItem', content: 'Option 1', selected: true },
        { type: 'menuItem', content: 'Option 2', selected: false },
      ]);
    });

    it('VALID: {renderResult with callbacks} => returns callbacks in response', () => {
      handleGetScreenLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: 'Some text' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const onSubmitKey = CallbackKeyStub({ value: 'onSubmit' });
      const callbacks = new Map<CallbackKey, unknown[]>();
      callbacks.set(onSubmitKey, [{ value: 'submitted' }]);

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.callbacks).toStrictEqual({
        onSubmit: [{ value: 'submitted' }],
      });
    });

    it('VALID: {frame with text content} => parses text elements', () => {
      handleGetScreenLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: 'Welcome to the CLI' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.elements).toStrictEqual([
        { type: 'text', content: 'Welcome to the CLI' },
      ]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {renderResult undefined} => returns error response', () => {
      handleGetScreenLayerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot get screen');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {lastFrame returns undefined} => uses empty string as frame', () => {
      handleGetScreenLayerBrokerProxy();
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => undefined),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.frame).toBe('');
      expect(result.screen?.elements).toStrictEqual([]);
    });

    it('EDGE: {empty callbacks map} => returns empty callbacks object', () => {
      handleGetScreenLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: 'Content' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleGetScreenLayerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.callbacks).toStrictEqual({});
    });
  });
});
