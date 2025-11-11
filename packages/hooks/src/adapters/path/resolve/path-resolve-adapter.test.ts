import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';
import { resolve } from 'path';

describe('pathResolveAdapter', () => {
  it('VALID: {paths: ["/base", "relative", "file.ts"]} => resolves paths to absolute file path', () => {
    pathResolveAdapterProxy();

    const result = pathResolveAdapter({ paths: ['/base', 'relative', 'file.ts'] });

    expect(result).toBe(resolve('/base', 'relative', 'file.ts'));
  });
});
