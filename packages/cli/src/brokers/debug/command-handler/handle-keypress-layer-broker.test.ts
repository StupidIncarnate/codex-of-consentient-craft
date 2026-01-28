import {
  DebugCommandKeypressStub,
  DebugCommandStartStub,
} from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';
import { debugKeysStatics } from '../../../statics/debug-keys/debug-keys-statics';

import { handleKeypressLayerBroker } from './handle-keypress-layer-broker';
import { handleKeypressLayerBrokerProxy } from './handle-keypress-layer-broker.proxy';

describe('handleKeypressLayerBroker', () => {
  describe('successful keypress', () => {
    it('VALID: {key: "enter"} => writes enter escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'enter' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.enter);
    });

    it('VALID: {key: "escape"} => writes escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'escape' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.escape);
    });

    it('VALID: {key: "up"} => writes up arrow escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'up' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.up);
    });

    it('VALID: {key: "down"} => writes down arrow escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'down' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.down);
    });

    it('VALID: {key: "backspace"} => writes backspace escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'backspace' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.backspace);
    });

    it('VALID: {key: "tab"} => writes tab escape code to stdin', () => {
      handleKeypressLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'tab' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(debugKeysStatics.codes.tab);
    });
  });

  describe('error cases', () => {
    it('ERROR: {renderResult undefined} => returns error response', () => {
      handleKeypressLayerBrokerProxy();

      const result = handleKeypressLayerBroker({
        command: DebugCommandKeypressStub({ key: 'enter' }),
        renderResult: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot send keypress');
    });

    it('ERROR: {action not keypress} => returns invalid action error', () => {
      handleKeypressLayerBrokerProxy();
      const renderResult = DebugRenderResultStub({
        stdin: { write: jest.fn(() => true) },
      });

      const result = handleKeypressLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid command action for keypress handler');
    });
  });
});
