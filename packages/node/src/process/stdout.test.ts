import { stdout } from './stdout';

describe('stdout', () => {
  it('VALID: {} => is the same Writable object process.stdout is', () => {
    expect(stdout).toBe(process.stdout);
  });
});
