import { childProcessExecSyncAdapter } from './child-process-exec-sync-adapter';
import { childProcessExecSyncAdapterProxy } from './child-process-exec-sync-adapter.proxy';

describe('childProcessExecSyncAdapter', () => {
  it('VALID: {command: "echo test"} => returns command output', () => {
    const proxy = childProcessExecSyncAdapterProxy();
    const mockOutput = 'command output';
    proxy.returns({ output: mockOutput });

    const result = childProcessExecSyncAdapter({
      command: 'echo test',
      options: { encoding: 'utf8' },
    });

    expect(result).toBe(mockOutput);
  });

  it('ERROR: {command: "invalid-command"} => throws execution error', () => {
    const proxy = childProcessExecSyncAdapterProxy();
    const mockError = new Error('Command failed');
    proxy.throws({ error: mockError });

    expect(() =>
      childProcessExecSyncAdapter({
        command: 'invalid-command',
      }),
    ).toThrow('Failed to execute command: invalid-command');
  });
});
