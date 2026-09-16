import { callerRepoRootSourceContract } from './caller-repo-root-source-contract';
import { CallerRepoRootSourceStub } from './caller-repo-root-source.stub';

describe('callerRepoRootSourceContract', () => {
  it('VALID: {value: "caller-cwd"} => parses successfully', () => {
    const result = callerRepoRootSourceContract.parse(
      CallerRepoRootSourceStub({ value: 'caller-cwd' }),
    );

    expect(result).toBe('caller-cwd');
  });

  it('VALID: {value: "server-cwd-fallback"} => parses successfully', () => {
    const result = callerRepoRootSourceContract.parse(
      CallerRepoRootSourceStub({ value: 'server-cwd-fallback' }),
    );

    expect(result).toBe('server-cwd-fallback');
  });

  it('INVALID: {value: "unknown"} => throws', () => {
    expect(() => callerRepoRootSourceContract.parse('unknown')).toThrow(/Invalid enum value/u);
  });
});
