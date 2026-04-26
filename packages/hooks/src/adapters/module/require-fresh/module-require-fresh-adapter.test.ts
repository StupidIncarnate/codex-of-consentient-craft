import { moduleRequireFreshAdapter } from './module-require-fresh-adapter';
import { moduleRequireFreshAdapterProxy } from './module-require-fresh-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('moduleRequireFreshAdapter', () => {
  it('VALID: {filePath} => returns loaded module value', () => {
    const proxy = moduleRequireFreshAdapterProxy();
    const filePath = FilePathStub({ value: '/path/to/config.js' });
    proxy.returns({ value: undefined });

    const result = moduleRequireFreshAdapter({ filePath });

    expect(result).toBe(undefined);
  });
});
