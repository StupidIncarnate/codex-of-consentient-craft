import { DebugCommandStartStub } from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';
import { TerminalFrameStub } from '../../../contracts/terminal-frame/terminal-frame.stub';
import { CallbackKeyStub } from '../../../contracts/callback-key/callback-key.stub';

import { handleStartLayerBroker } from './handle-start-layer-broker';
import { handleStartLayerBrokerProxy } from './handle-start-layer-broker.proxy';

type CallbackKey = ReturnType<typeof CallbackKeyStub>;

describe('handleStartLayerBroker', () => {
  describe('successful start', () => {
    it('VALID: {renderResult with frame} => returns success with screen info', () => {
      handleStartLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: '> Option 1\n  Option 2' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleStartLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
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
      handleStartLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: 'Some text' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const onClickKey = CallbackKeyStub({ value: 'onClick' });
      const callbacks = new Map<CallbackKey, unknown[]>();
      callbacks.set(onClickKey, [{ clicked: true }]);

      const result = handleStartLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.callbacks).toStrictEqual({
        onClick: [{ clicked: true }],
      });
    });

    it('VALID: {renderResult with empty frame} => returns success with empty elements', () => {
      handleStartLayerBrokerProxy();
      const frame = TerminalFrameStub({ value: '' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleStartLayerBroker({
        command: DebugCommandStartStub({ screen: 'help' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.elements).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {renderResult undefined} => returns error response', () => {
      handleStartLayerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleStartLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - renderResult is undefined');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {lastFrame returns undefined} => uses empty string as frame', () => {
      handleStartLayerBrokerProxy();
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => undefined),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = handleStartLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.frame).toBe('');
      expect(result.screen?.elements).toStrictEqual([]);
    });
  });
});
