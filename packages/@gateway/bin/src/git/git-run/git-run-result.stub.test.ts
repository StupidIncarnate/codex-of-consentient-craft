import { GitRunResultStub } from './git-run-result.stub';

describe('GitRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = GitRunResultStub();

    expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
  });

  it('VALID: {exitCode, output, signal, timedOut} => carries every field through unchanged', () => {
    const result = GitRunResultStub({
      exitCode: 1,
      output: 'fatal: not a git repository',
      signal: 'SIGKILL',
      timedOut: true,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: 'fatal: not a git repository',
      signal: 'SIGKILL',
      timedOut: true,
    });
  });
});
