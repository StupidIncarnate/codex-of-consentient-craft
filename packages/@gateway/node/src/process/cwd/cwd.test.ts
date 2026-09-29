import { cwd } from './cwd';
import { cwdProxy } from './cwd.proxy';

describe('cwd', () => {
  it('VALID: {} => returns the same value process.cwd() does', () => {
    expect(cwd()).toBe(process.cwd());
  });

  it('VALID: {staged: /staged/repo} => returns the staged directory', () => {
    const proxy = cwdProxy();
    proxy.setupCwd({ value: '/staged/repo' });

    expect(cwd()).toBe('/staged/repo');
  });

  it('EMPTY: {nothing staged} => still returns the real directory', () => {
    cwdProxy();

    expect(cwd()).toBe(process.cwd());
  });
});
