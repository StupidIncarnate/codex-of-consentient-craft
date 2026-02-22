import { pathJoinAdapter } from './path-join-adapter';
import { pathJoinAdapterProxy } from './path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('pathJoinAdapter', () => {
  it('VALID: {paths: ["/base", "folder", "file.ts"]} => returns joined path', () => {
    const adapterProxy = pathJoinAdapterProxy();
    const paths = ['/base', 'folder', 'file.ts'];
    const expectedPath = FilePathStub({ value: '/base/folder/file.ts' });

    adapterProxy.returns({ paths, result: expectedPath });

    const result = pathJoinAdapter({ paths });

    expect(result).toStrictEqual(expectedPath);
  });

  it('VALID: {paths: ["/path"]} => returns single path', () => {
    const adapterProxy = pathJoinAdapterProxy();
    const paths = ['/path'];
    const expectedPath = FilePathStub({ value: '/path' });

    adapterProxy.returns({ paths, result: expectedPath });

    const result = pathJoinAdapter({ paths });

    expect(result).toStrictEqual(expectedPath);
  });
});
