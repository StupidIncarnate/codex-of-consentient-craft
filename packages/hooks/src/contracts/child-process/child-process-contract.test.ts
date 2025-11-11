import { childProcessContract } from './child-process-contract';
import { ChildProcessStub } from './child-process.stub';

describe('childProcessContract', () => {
  describe('valid child process', () => {
    it('VALID: {pid: 1234} => parses successfully', () => {
      const process = ChildProcessStub({ pid: 1234 });

      const result = childProcessContract.parse(process);

      expect(result.pid).toBe(1234);
    });

    it('VALID: {minimal properties} => parses with defaults', () => {
      const process = ChildProcessStub();

      const result = childProcessContract.parse(process);

      expect(result).toStrictEqual({
        pid: 1234,
        stdin: null,
        stdout: null,
        stderr: null,
        stdio: [null, null, null],
      });
    });
  });
});
