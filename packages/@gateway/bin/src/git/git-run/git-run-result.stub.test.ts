import { GitRunResultStub } from './git-run-result.stub';

describe('GitRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = GitRunResultStub();

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
    const result = GitRunResultStub({
      exitCode: 1,
      output: 'fatal: not a git repository',
      stdout: 'fatal: not a git repository',
      stderr: 'warning: printed on stderr',
      signal: 'SIGKILL',
      timedOut: true,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'fatal: not a git repository',
      stdout: 'fatal: not a git repository',
      stderr: 'warning: printed on stderr',
      signal: 'SIGKILL',
      timedOut: true,
    });
  });
});
