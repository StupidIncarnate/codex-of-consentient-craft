import { fsReadFileSyncAdapter } from './fs-read-file-sync-adapter';
import { fsReadFileSyncAdapterProxy } from './fs-read-file-sync-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@questmaestro/shared/contracts';

describe('fsReadFileSyncAdapter', () => {
  it('VALID: {filePath: "/config.json"} => returns file contents', () => {
    const adapterProxy = fsReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/config.json' });
    const expected = FileContentsStub({ value: '{"key": "value"}' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsReadFileSyncAdapter({ filePath });

    expect(result).toStrictEqual(expected);
  });

  it('EMPTY: {filePath: "/empty.txt"} => returns empty string', () => {
    const adapterProxy = fsReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/empty.txt' });
    const expected = FileContentsStub({ value: '' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsReadFileSyncAdapter({ filePath });

    expect(result).toStrictEqual(expected);
  });

  it('VALID: {filePath: "/data.txt", encoding: "utf-8"} => returns file contents', () => {
    const adapterProxy = fsReadFileSyncAdapterProxy();
    const filePath = FilePathStub({ value: '/data.txt' });
    const expected = FileContentsStub({ value: 'Hello, World!' });

    adapterProxy.returns({ filePath, contents: expected });

    const result = fsReadFileSyncAdapter({ filePath, encoding: 'utf-8' });

    expect(result).toStrictEqual(expected);
  });
});
