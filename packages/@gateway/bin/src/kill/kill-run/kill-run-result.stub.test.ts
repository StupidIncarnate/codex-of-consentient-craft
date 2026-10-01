import { KillRunResultStub } from './kill-run-result.stub';

describe('KillRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = KillRunResultStub();

    expect(result).toStrictEqual({
      exitCode: 0,
      output: '',
      stdout: '',
      stderr: '',
      signal: null,
      timedOut: false,
    });
  });

  it('VALID: {exitCode, output, stdout, stderr, signal, timedOut} => carries every field through unchanged', () => {
    const result = KillRunResultStub({
      exitCode: 1,
      output: 'kill: (12345): No such process',
      stdout: 'kill: (12345): No such process',
      stderr: 'warning: printed on stderr',
      signal: null,
      timedOut: false,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'kill: (12345): No such process',
      stdout: 'kill: (12345): No such process',
      stderr: 'warning: printed on stderr',
      signal: null,
      timedOut: false,
    });
  });
});
