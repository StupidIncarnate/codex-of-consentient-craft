import { NpmRunResultStub } from './npm-run-result.stub';

describe('NpmRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = NpmRunResultStub();

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
    const result = NpmRunResultStub({
      exitCode: 1,
      output: 'npm ERR! code ENOENT',
      stdout: 'npm ERR! code ENOENT',
      stderr: 'warning: printed on stderr',
      signal: 'SIGKILL',
      timedOut: true,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'npm ERR! code ENOENT',
      stdout: 'npm ERR! code ENOENT',
      stderr: 'warning: printed on stderr',
      signal: 'SIGKILL',
      timedOut: true,
    });
  });
});
