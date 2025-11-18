import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';

describe('pathResolveAdapter', () => {
  it('VALID: {paths: ["/base", "file.ts"]} => resolves to absolute path', () => {
    pathResolveAdapterProxy();

    const result = pathResolveAdapter({ paths: ['/base', 'file.ts'] });

    expect(result).toBe('/base/file.ts');
  });

  it('VALID: {paths: ["/base", "sub", "file.ts"]} => resolves multiple segments', () => {
    pathResolveAdapterProxy();

    const result = pathResolveAdapter({ paths: ['/base', 'sub', 'file.ts'] });

    expect(result).toBe('/base/sub/file.ts');
  });

  it('VALID: {paths: ["relative/path.ts"]} => resolves to absolute path from cwd', () => {
    pathResolveAdapterProxy();

    const result = pathResolveAdapter({ paths: ['relative/path.ts'] });

    expect(result).toMatch(/^\//u);
    expect(result).toMatch(/relative\/path\.ts$/u);
  });
});
