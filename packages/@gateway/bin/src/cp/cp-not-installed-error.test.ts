import { CpNotInstalledError } from './cp-not-installed-error';

describe('CpNotInstalledError', () => {
  it('VALID: {message: "cp missing"} => is an Error carrying that message', () => {
    const error = new CpNotInstalledError('cp missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('cp missing');
  });
});
