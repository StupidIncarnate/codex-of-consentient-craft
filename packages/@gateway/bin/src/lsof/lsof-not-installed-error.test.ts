import { LsofNotInstalledError } from './lsof-not-installed-error';

describe('LsofNotInstalledError', () => {
  it('VALID: {message: "lsof missing"} => is an Error carrying that message', () => {
    const error = new LsofNotInstalledError('lsof missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('lsof missing');
  });
});
