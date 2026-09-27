import { GitNotInstalledError } from './git-not-installed-error';

describe('GitNotInstalledError', () => {
  it('VALID: {message: "git missing"} => is an Error carrying that message', () => {
    const error = new GitNotInstalledError('git missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('git missing');
  });
});
