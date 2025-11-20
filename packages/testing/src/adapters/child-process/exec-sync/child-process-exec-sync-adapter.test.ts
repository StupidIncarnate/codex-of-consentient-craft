import { childProcessExecSyncAdapter } from './child-process-exec-sync-adapter';
import { childProcessExecSyncAdapterProxy } from './child-process-exec-sync-adapter.proxy';
import { FileContentStub } from '../../../contracts/file-content/file-content.stub';

describe('childProcessExecSyncAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command: "ls -la"} => returns command output as Buffer', () => {
      const proxy = childProcessExecSyncAdapterProxy();
      const command = 'ls -la';
      const output = Buffer.from('file1.txt\nfile2.txt');

      proxy.returns({ command, output });

      const result = childProcessExecSyncAdapter({ command });

      expect(result).toStrictEqual(output);
    });

    it('VALID: {command: "echo test", options: {encoding: "utf-8"}} => returns FileContent output', () => {
      const proxy = childProcessExecSyncAdapterProxy();
      const command = 'echo test';
      const output = FileContentStub({ value: 'test\n' });

      proxy.returns({ command, output });

      const result = childProcessExecSyncAdapter({ command, options: { encoding: 'utf-8' } });

      expect(result).toStrictEqual(FileContentStub({ value: 'test\n' }));
    });
  });

  describe('error cases', () => {
    it('ERROR: {command: "invalid-command"} => throws error', () => {
      const proxy = childProcessExecSyncAdapterProxy();
      const command = 'invalid-command';

      proxy.throws({ command, error: new Error('Command not found') });

      expect(() => {
        childProcessExecSyncAdapter({ command });
      }).toThrow(/Command not found/u);
    });

    it('ERROR: {command: "exit 1"} => throws error with exit code', () => {
      const proxy = childProcessExecSyncAdapterProxy();
      const command = 'exit 1';

      proxy.throws({ command, error: new Error('Command failed with exit code 1') });

      expect(() => {
        childProcessExecSyncAdapter({ command });
      }).toThrow(/exit code 1/u);
    });
  });
});
