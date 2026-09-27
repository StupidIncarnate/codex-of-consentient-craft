import { writeFileFromBase64 } from './write-file-from-base64';
import { writeFileFromBase64Proxy } from './write-file-from-base64.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('writeFileFromBase64', () => {
  it('VALID: {path, base64} => decodes the payload and writes the bytes', async () => {
    const proxy = writeFileFromBase64Proxy();
    proxy.succeeds({ path: '/repo/tmp/image.png' });

    await expect(
      writeFileFromBase64('/repo/tmp/image.png', Buffer.from('hello').toString('base64')),
    ).resolves.toBe(undefined);
    expect(proxy.writtenBytesFor({ path: '/repo/tmp/image.png' })).toStrictEqual(
      Buffer.from('hello'),
    );
  });

  it('ERROR: {missing parent folder} => rejects with the raw ENOENT error', async () => {
    const proxy = writeFileFromBase64Proxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/image.png' });
    proxy.rejects({ path: '/missing/image.png', error });

    await expect(writeFileFromBase64('/missing/image.png', 'aGVsbG8=')).rejects.toBe(error);
  });
});
