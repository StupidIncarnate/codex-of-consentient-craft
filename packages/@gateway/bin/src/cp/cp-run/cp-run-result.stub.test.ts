import { CpRunResultStub } from './cp-run-result.stub';

describe('CpRunResultStub', () => {
  it('VALID: {} => defaults to a clean success result', () => {
    const result = CpRunResultStub();

    expect(result).toStrictEqual({ exitCode: 0, output: '', signal: null, timedOut: false });
  });

  it('VALID: {exitCode, output, signal, timedOut} => carries every field through unchanged', () => {
    const result = CpRunResultStub({
      exitCode: 1,
      output: "cp: cannot stat 'x': No such file or directory",
      signal: 'SIGTERM',
      timedOut: true,
    });

    expect(result).toStrictEqual({
      exitCode: 1,
      output: "cp: cannot stat 'x': No such file or directory",
      signal: 'SIGTERM',
      timedOut: true,
    });
  });
});
