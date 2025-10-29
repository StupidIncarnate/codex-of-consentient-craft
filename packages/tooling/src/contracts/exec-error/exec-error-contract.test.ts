import { ExecErrorStub } from './exec-error.stub';
import { ExitCodeStub } from '../exit-code/exit-code.stub';

describe('execErrorContract', () => {
  it('VALID: {status: 1, stdout: Buffer, stderr: Buffer} => creates exec error', () => {
    const result = ExecErrorStub({
      status: ExitCodeStub({ value: 1 }),
      stdout: Buffer.from('output'),
      stderr: Buffer.from('error'),
    });

    expect(result).toBeInstanceOf(Error);
    expect(result.status).toBe(1);
  });

  it('VALID: defaults => creates exec error with default values', () => {
    const result = ExecErrorStub();

    expect(result).toBeInstanceOf(Error);
    expect(result.status).toBe(1);
  });
});
