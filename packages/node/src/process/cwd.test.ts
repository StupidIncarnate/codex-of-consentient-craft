import { cwd } from './cwd';

describe('cwd', () => {
  it('VALID: {} => returns the same value process.cwd() does', () => {
    expect(cwd()).toBe(process.cwd());
  });
});
