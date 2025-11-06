import { pathResolveAdapter } from './path-resolve-adapter';
import { pathResolveAdapterProxy } from './path-resolve-adapter.proxy';
import { filePathStub } from '../../../../contracts/file-path/file-path.stub';

describe('pathResolveAdapter', () => {
  it('should resolve paths to absolute file path', () => {
    pathResolveAdapterProxy.mockReturnValue(filePathStub);

    const result = pathResolveAdapter({ paths: ['/base', 'relative', 'file.ts'] });

    expect(result).toBe(filePathStub);
    expect(pathResolveAdapterProxy).toHaveBeenCalledWith({
      paths: ['/base', 'relative', 'file.ts'],
    });
  });
});
