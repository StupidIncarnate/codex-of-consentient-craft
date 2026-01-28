import {
  DebugCommandStartStub,
  DebugCommandInputStub,
  DebugCommandKeypressStub,
  DebugCommandGetScreenStub,
  DebugCommandExitStub,
} from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';
import { TerminalFrameStub } from '../../../contracts/terminal-frame/terminal-frame.stub';
import type { CallbackKeyStub } from '../../../contracts/callback-key/callback-key.stub';
import { debugKeysStatics } from '../../../statics/debug-keys/debug-keys-statics';

import { debugCommandHandlerBroker } from './debug-command-handler-broker';
import { debugCommandHandlerBrokerProxy } from './debug-command-handler-broker.proxy';

type CallbackKey = ReturnType<typeof CallbackKeyStub>;

describe('debugCommandHandlerBroker', () => {
  describe('start command', () => {
    it('VALID: {action: "start"} => delegates to handleStartLayerBroker', () => {
      debugCommandHandlerBrokerProxy();
      const frame = TerminalFrameStub({ value: '> Menu Item' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.name).toBe('CliAppWidget');
    });
  });

  describe('input command', () => {
    it('VALID: {action: "input"} => delegates to handleInputLayerBroker', () => {
      debugCommandHandlerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandInputStub({ text: 'test input' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(TerminalFrameStub({ value: 'test input' }));
    });
  });

  describe('keypress command', () => {
    it('VALID: {action: "keypress"} => delegates to handleKeypressLayerBroker', () => {
      debugCommandHandlerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandKeypressStub({ key: 'enter' }),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.enter);
    });
  });

  describe('getScreen command', () => {
    it('VALID: {action: "getScreen"} => delegates to handleGetScreenLayerBroker', () => {
      debugCommandHandlerBrokerProxy();
      const frame = TerminalFrameStub({ value: 'Current screen content' });
      const renderResult = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(result.screen?.frame).toBe('Current screen content');
    });
  });

  describe('exit command', () => {
    it('VALID: {action: "exit"} => delegates to handleExitLayerBroker', () => {
      debugCommandHandlerBrokerProxy();
      const unmountMock = jest.fn();
      const renderResult = DebugRenderResultStub({
        unmount: unmountMock,
      });
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandExitStub(),
        renderResult,
        callbacks,
      });

      expect(result.success).toBe(true);
      expect(unmountMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('error cases', () => {
    it('ERROR: {renderResult undefined, action: "start"} => returns error', () => {
      debugCommandHandlerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - renderResult is undefined');
    });

    it('ERROR: {renderResult undefined, action: "input"} => returns error', () => {
      debugCommandHandlerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandInputStub({ text: 'test' }),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot write input');
    });

    it('ERROR: {renderResult undefined, action: "keypress"} => returns error', () => {
      debugCommandHandlerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandKeypressStub({ key: 'enter' }),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot send keypress');
    });

    it('ERROR: {renderResult undefined, action: "getScreen"} => returns error', () => {
      debugCommandHandlerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandGetScreenStub(),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot get screen');
    });

    it('EDGE: {renderResult undefined, action: "exit"} => returns success without error', () => {
      debugCommandHandlerBrokerProxy();
      const callbacks = new Map<CallbackKey, unknown[]>();

      const result = debugCommandHandlerBroker({
        command: DebugCommandExitStub(),
        renderResult: undefined,
        callbacks,
      });

      expect(result.success).toBe(true);
    });
  });
});
