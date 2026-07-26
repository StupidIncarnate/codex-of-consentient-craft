import { fsAppendFileAdapter } from './fs-append-file-adapter';
import { fsAppendFileAdapterProxy } from './fs-append-file-adapter.proxy';
import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

describe('fsAppendFileAdapter', () => {
  it('VALID: {filePath, contents} => appends content', async () => {
    const proxy = fsAppendFileAdapterProxy();
    const filePath = FilePathStub({ value: '/log.jsonl' });
    proxy.succeeds({ filePath });

    const result = await fsAppendFileAdapter({
      filePath,
      contents: FileContentsStub({ value: '{"a":1}\n' }),
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getAppendCalls()).toStrictEqual([{ path: '/log.jsonl', content: '{"a":1}\n' }]);
  });

  it('ERROR: {filePath: readonly} => rejects', async () => {
    const proxy = fsAppendFileAdapterProxy();
    const filePath = FilePathStub({ value: '/readonly' });
    proxy.throws({ filePath, error: new Error('EACCES') });

    await expect(
      fsAppendFileAdapter({
        filePath,
        contents: FileContentsStub({ value: 'x' }),
      }),
    ).rejects.toThrow(/EACCES/u);
  });
});
