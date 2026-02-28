import { childProcessExecAdapter } from './child-process-exec-adapter';
import { childProcessExecAdapterProxy } from './child-process-exec-adapter.proxy';

describe('childProcessExecAdapter', () => {
  describe('command execution', () => {
    it('VALID: {command: "open http://localhost"} => executes the command', () => {
      const proxy = childProcessExecAdapterProxy();

      childProcessExecAdapter({ command: 'open http://localhost' });

      expect(proxy.getExecCalls()).toStrictEqual(['open http://localhost']);
    });
  });
});
