import { DebugCommandExitStub } from '../../../contracts/debug-command/debug-command.stub';
import { DebugRenderResultStub } from '../../../contracts/debug-render-result/debug-render-result.stub';

import { handleExitLayerBroker } from './handle-exit-layer-broker';
import { handleExitLayerBrokerProxy } from './handle-exit-layer-broker.proxy';

describe('handleExitLayerBroker', () => {
  describe('successful exit', () => {
    it('VALID: {renderResult exists} => calls unmount and returns success', () => {
      handleExitLayerBrokerProxy();
      const unmountMock = jest.fn();
      const renderResult = DebugRenderResultStub({
        unmount: unmountMock,
      });

      const result = handleExitLayerBroker({
        command: DebugCommandExitStub(),
        renderResult,
      });

      expect(result.success).toBe(true);
      expect(unmountMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {renderResult undefined} => returns success without calling unmount', () => {
      handleExitLayerBrokerProxy();

      const result = handleExitLayerBroker({
        command: DebugCommandExitStub(),
        renderResult: undefined,
      });

      expect(result.success).toBe(true);
    });
  });
});
