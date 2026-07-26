import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathResolveAdapter', () => {
  it('VALID: {paths: ["/base", "relative", "file.ts"]} => returns the resolved path from path.resolve', () => {
    const proxy = pathResolveAdapterProxy();
    const expectedPath = FilePathStub({ value: '/base/relative/file.ts' });

    proxy.returns({ paths: ['/base', 'relative', 'file.ts'], path: expectedPath });

    const result = pathResolveAdapter({ paths: ['/base', 'relative', 'file.ts'] });

    expect(result).toBe(expectedPath);
  });
});
