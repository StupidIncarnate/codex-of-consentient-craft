import { writeFileBytes } from './write-file-bytes';
import { writeFileBytesProxy } from './write-file-bytes.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('writeFileBytes', () => {
  it('VALID: {path, bytes} => writes the bytes as-is and resolves', async () => {
    const proxy = writeFileBytesProxy();
    proxy.succeeds({ path: '/repo/tmp/frame.png' });
    const bytes = new Uint8Array([1, 2, 3]);

    await expect(writeFileBytes('/repo/tmp/frame.png', bytes)).resolves.toBe(undefined);
    expect(proxy.writtenBytesFor({ path: '/repo/tmp/frame.png' })).toBe(bytes);
  });

  it('ERROR: {no space left on device} => rejects with the raw ENOSPC error', async () => {
    const proxy = writeFileBytesProxy();
    const error = FsErrorStub({ code: 'ENOSPC', path: '/repo/tmp/frame.png' });
    proxy.rejects({ path: '/repo/tmp/frame.png', error });

    await expect(writeFileBytes('/repo/tmp/frame.png', new Uint8Array())).rejects.toBe(error);
  });

  it('ERROR: {path is a directory} => rejects with the raw EISDIR error', async () => {
    const proxy = writeFileBytesProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/repo/tmp' });
    proxy.rejects({ path: '/repo/tmp', error });

    await expect(writeFileBytes('/repo/tmp', new Uint8Array())).rejects.toBe(error);
  });

  it('VALID: {two writes to the same path} => getCallsFor reads back each call in order', async () => {
    const proxy = writeFileBytesProxy();
    proxy.succeeds({ path: '/repo/tmp/frame.png' });
    const first = new Uint8Array([1]);
    const second = new Uint8Array([2]);

    await writeFileBytes('/repo/tmp/frame.png', first);
    await writeFileBytes('/repo/tmp/frame.png', second);

    expect(proxy.getCallsFor({ path: '/repo/tmp/frame.png' })).toStrictEqual([
      ['/repo/tmp/frame.png', first],
      ['/repo/tmp/frame.png', second],
    ]);
  });
});
