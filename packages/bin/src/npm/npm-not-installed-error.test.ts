import { NpmNotInstalledError } from './npm-not-installed-error';

describe('NpmNotInstalledError', () => {
  it('VALID: {message: "npm missing"} => is an Error carrying that message', () => {
    const error = new NpmNotInstalledError('npm missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('npm missing');
  });
});
