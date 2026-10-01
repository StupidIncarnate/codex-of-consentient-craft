import { LsofRunResultStub } from './lsof-run-result.stub';

describe('LsofRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = LsofRunResultStub();

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
    const result = LsofRunResultStub({
      exitCode: 1,
      output: '12345',
      stdout: '12345',
      stderr: 'warning: printed on stderr',
      signal: 'SIGTERM',
      timedOut: true,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: '12345',
      stdout: '12345',
      stderr: 'warning: printed on stderr',
      signal: 'SIGTERM',
      timedOut: true,
    });
  });
});
