import { TerminalFrameStub } from '../terminal-frame/terminal-frame.stub';

import { debugRenderResultContract } from './debug-render-result-contract';
import { DebugRenderResultStub } from './debug-render-result.stub';

describe('debugRenderResultContract', () => {
  describe('valid parsing', () => {
    it('VALID: {stub with defaults} => parses successfully', () => {
      const result = DebugRenderResultStub();

      expect(typeof result.lastFrame).toBe('function');
      expect(typeof result.stdin.write).toBe('function');
      expect(typeof result.unmount).toBe('function');
    });

    it('VALID: {lastFrame returns frame} => lastFrame callable', () => {
      const frame = TerminalFrameStub({ value: 'test frame content' });
      const result = DebugRenderResultStub({
        lastFrame: jest.fn(() => frame),
      });

      expect(result.lastFrame()).toBe('test frame content');
    });

    it('VALID: {stdin.write} => write callable', () => {
      const result = DebugRenderResultStub({
        stdin: { write: jest.fn(() => true) },
      });

      expect(result.stdin.write(TerminalFrameStub())).toBe(true);
    });

    it('VALID: {unmount} => unmount callable', () => {
      const unmountMock = jest.fn();
      const result = DebugRenderResultStub({
        unmount: unmountMock,
      });

      result.unmount();

      expect(unmountMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('contract validation', () => {
    it('VALID: {DebugRenderResultStub} => parses successfully', () => {
      const renderResult = DebugRenderResultStub();

      const result = debugRenderResultContract.parse(renderResult);

      expect(result).toStrictEqual(renderResult);
    });
  });
});
