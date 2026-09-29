import { getPlatform } from './get-platform';
import { getPlatformProxy } from './get-platform.proxy';

describe('getPlatform', () => {
  it('VALID: {staged: darwin} => reads the staged platform at call time', () => {
    const proxy = getPlatformProxy();
    proxy.setupPlatform({ value: 'darwin' });

    expect(getPlatform()).toBe('darwin');
  });

  it('VALID: {staged: win32} => reads the staged platform at call time', () => {
    const proxy = getPlatformProxy();
    proxy.setupPlatform({ value: 'win32' });

    expect(getPlatform()).toBe('win32');
  });

  it('EMPTY: {nothing staged} => the proxy starts every test on the real platform', () => {
    const proxy = getPlatformProxy();
    proxy.setupPlatform({ value: 'darwin' });
    getPlatformProxy();

    expect(getPlatform()).toBe(process.platform);
  });
});
