import { childProcessExecSyncAdapter } from './child-process-exec-sync-adapter';
import { childProcessExecSyncAdapterProxy } from './child-process-exec-sync-adapter.proxy';

describe('childProcessExecSyncAdapter', () => {
  it('should execute command successfully', () => {
    const mockOutput = 'command output';
    childProcessExecSyncAdapterProxy.mockReturnValue(mockOutput);

    const result = childProcessExecSyncAdapter({
      command: 'echo test',
      options: { encoding: 'utf8' },
    });

    expect(result).toBe(mockOutput);
  });

  it('should throw error on command failure', () => {
    const mockError = new Error('Command failed');
    childProcessExecSyncAdapterProxy.mockImplementation(() => {
      throw mockError;
    });

    expect(() =>
      childProcessExecSyncAdapter({
        command: 'invalid-command',
      }),
    ).toThrow('Failed to execute command: invalid-command');
  });
});
