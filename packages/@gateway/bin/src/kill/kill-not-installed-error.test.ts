import { KillNotInstalledError } from './kill-not-installed-error';

describe('KillNotInstalledError', () => {
  it('VALID: {message: "kill missing"} => is an Error carrying that message', () => {
    const error = new KillNotInstalledError('kill missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('kill missing');
  });
});
