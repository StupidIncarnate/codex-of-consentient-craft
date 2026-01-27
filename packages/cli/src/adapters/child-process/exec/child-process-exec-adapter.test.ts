import { AbsoluteFilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { childProcessExecAdapter } from './child-process-exec-adapter';
import { childProcessExecAdapterProxy } from './child-process-exec-adapter.proxy';
import { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';
import { StderrStub } from '../../../contracts/stderr/stderr.stub';
import { StdoutStub } from '../../../contracts/stdout/stdout.stub';

describe('childProcessExecAdapter', () => {
  describe('successful execution', () => {
    it('VALID: {command succeeds} => returns stdout, stderr, exitCode 0', async () => {
      const proxy = childProcessExecAdapterProxy();
      const cwd = AbsoluteFilePathStub({ value: '/home/user/project' });
      const expectedResult = ExecResultStub({
        stdout: 'Build successful',
        stderr: '',
        exitCode: 0,
      });

      proxy.resolves({ result: expectedResult });

      const result = await childProcessExecAdapter({
        command: 'npm run build',
        cwd,
      });

      expect(result).toStrictEqual({
        stdout: StdoutStub({ value: 'Build successful' }),
        stderr: StderrStub({ value: '' }),
        exitCode: ExitCodeStub({ value: 0 }),
      });
    });

    it('VALID: {command with stderr output} => returns stdout, stderr, exitCode 0', async () => {
      const proxy = childProcessExecAdapterProxy();
      const cwd = AbsoluteFilePathStub({ value: '/home/user/project' });
      const expectedResult = ExecResultStub({
        stdout: 'Output',
        stderr: 'Warning: deprecated feature',
        exitCode: 0,
      });

      proxy.resolves({ result: expectedResult });

      const result = await childProcessExecAdapter({
        command: 'npm run build',
        cwd,
      });

      expect(result).toStrictEqual({
        stdout: StdoutStub({ value: 'Output' }),
        stderr: StderrStub({ value: 'Warning: deprecated feature' }),
        exitCode: ExitCodeStub({ value: 0 }),
      });
    });
  });

  describe('failed execution', () => {
    it('ERROR: {command fails with error} => returns error details', async () => {
      const proxy = childProcessExecAdapterProxy();
      const cwd = AbsoluteFilePathStub({ value: '/home/user/project' });
      const error = new Error('Command failed');

      proxy.rejects({ error });

      const result = await childProcessExecAdapter({
        command: 'npm run invalid',
        cwd,
      });

      expect(result).toStrictEqual({
        stdout: StdoutStub({ value: '' }),
        stderr: StderrStub({ value: 'Command failed' }),
        exitCode: ExitCodeStub({ value: 1 }),
      });
    });
  });
});
