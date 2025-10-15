import { fsEnsureReadFileSyncAdapter } from './fs-ensure-read-file-sync-adapter';
import { fsEnsureReadFileSyncAdapterProxy } from './fs-ensure-read-file-sync-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@questmaestro/shared/contracts';

describe('fsEnsureReadFileSyncAdapter', () => {
  it('VALID: {filePath: "/exists.ts"} => returns file contents', () => {
    const adapterProxy = fsEnsureReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/exists.ts' });
    const expected = FileContentsStub({ value: 'export const foo = "bar";' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsEnsureReadFileSyncAdapter({ filePath });

    expect(result).toStrictEqual(expected);
  });

  it('EMPTY: {filePath: "/empty.ts"} => returns empty string', () => {
    const adapterProxy = fsEnsureReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/empty.ts' });
    const expected = FileContentsStub({ value: '' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsEnsureReadFileSyncAdapter({ filePath });

    expect(result).toStrictEqual(expected);
  });

  it('ERROR: {filePath: "/not-exists.ts"} => throws "File not found"', () => {
    const adapterProxy = fsEnsureReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/not-exists.ts' });

    adapterProxy.throwsFileNotFound();

    expect(() => {
      return fsEnsureReadFileSyncAdapter({ filePath });
    }).toThrow('File not found: /not-exists.ts');
  });

  it('VALID: {filePath: "/data.txt", encoding: "utf-8"} => returns file contents', () => {
    const adapterProxy = fsEnsureReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/data.txt' });
    const expected = FileContentsStub({ value: 'Hello, World!' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsEnsureReadFileSyncAdapter({ filePath, encoding: 'utf-8' });

    expect(result).toStrictEqual(expected);
  });
});
