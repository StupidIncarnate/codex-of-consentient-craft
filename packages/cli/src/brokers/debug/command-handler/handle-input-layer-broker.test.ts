import {
  DebugCommandInputStub,
  DebugCommandStartStub,
} from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';
import { TerminalFrameStub } from '../../../contracts/terminal-frame/terminal-frame.stub';

import { handleInputLayerBroker } from './handle-input-layer-broker';
import { handleInputLayerBrokerProxy } from './handle-input-layer-broker.proxy';

describe('handleInputLayerBroker', () => {
  describe('successful input', () => {
    it('VALID: {text: "hello"} => writes text to stdin and returns success', () => {
      handleInputLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleInputLayerBroker({
        command: DebugCommandInputStub({ text: 'hello' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(TerminalFrameStub({ value: 'hello' }));
    });

    it('VALID: {text: "multi word input"} => writes full text to stdin', () => {
      handleInputLayerBrokerProxy();
      const writeMock = jest.fn(() => true);
      const renderResult = DebugRenderResultStub({
        stdin: { write: writeMock },
      });

      const result = handleInputLayerBroker({
        command: DebugCommandInputStub({ text: 'multi word input' }),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(writeMock).toHaveBeenCalledWith(TerminalFrameStub({ value: 'multi word input' }));
    });
  });

  describe('error cases', () => {
    it('ERROR: {renderResult undefined} => returns error response', () => {
      handleInputLayerBrokerProxy();

      const result = handleInputLayerBroker({
        command: DebugCommandInputStub({ text: 'hello' }),
        renderResult: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Widget not rendered - cannot write input');
    });

    it('ERROR: {action not input} => returns invalid action error', () => {
      handleInputLayerBrokerProxy();
      const renderResult = DebugRenderResultStub({
        stdin: { write: jest.fn(() => true) },
      });

      const result = handleInputLayerBroker({
        command: DebugCommandStartStub({ screen: 'menu' }),
        renderResult,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid command action for input handler');
    });
  });
});
