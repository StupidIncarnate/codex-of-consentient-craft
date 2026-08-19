import { serverPackageVersionAdapter } from './server-package-version-adapter';
import { serverPackageVersionAdapterProxy } from './server-package-version-adapter.proxy';

describe('serverPackageVersionAdapter', () => {
  it('VALID: {manifest with version "0.1.0"} => returns "0.1.0"', () => {
    const proxy = serverPackageVersionAdapterProxy();
    proxy.returnsManifest({ version: '0.1.0' });

    const result = serverPackageVersionAdapter();

    expect(result).toBe('0.1.0');
  });

  it('VALID: {manifest with version "9.9.9"} => returns "9.9.9"', () => {
    const proxy = serverPackageVersionAdapterProxy();
    proxy.returnsManifest({ version: '9.9.9' });

    const result = serverPackageVersionAdapter();

    expect(result).toBe('9.9.9');
  });

  it('ERROR: {manifest without a version field} => throws naming the specifier', () => {
    const proxy = serverPackageVersionAdapterProxy();
    proxy.returnsRawManifest({ raw: JSON.stringify({ name: '@dungeonmaster/server' }) });

    expect(() => {
      serverPackageVersionAdapter();
    }).toThrow(/@dungeonmaster\/server\/package\.json/u);
  });

  it('ERROR: {manifest is not valid JSON} => throws naming the specifier', () => {
    const proxy = serverPackageVersionAdapterProxy();
    proxy.returnsRawManifest({ raw: 'not valid json{' });

    expect(() => {
      serverPackageVersionAdapter();
    }).toThrow(/@dungeonmaster\/server\/package\.json/u);
  });

  it('ERROR: {read fails with ENOENT} => throws naming the specifier', () => {
    const proxy = serverPackageVersionAdapterProxy();
    proxy.readFails({ error: new Error('ENOENT: no such file or directory') });

    expect(() => {
      serverPackageVersionAdapter();
    }).toThrow(/@dungeonmaster\/server\/package\.json/u);
  });
});
