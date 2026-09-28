import { writeFileFromBase64 } from './write-file-from-base64';
import { writeFileFromBase64Proxy } from './write-file-from-base64.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

const underImages = (value: unknown): boolean =>
  typeof value === 'string' && value.includes('/images/');

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

  it('VALID: {two calls to the same path} => getCallsFor reads back each write call in order', async () => {
    const proxy = writeFileFromBase64Proxy();
    proxy.succeeds({ path: '/repo/tmp/image.png' });

    await writeFileFromBase64('/repo/tmp/image.png', Buffer.from('a').toString('base64'));
    await writeFileFromBase64('/repo/tmp/image.png', Buffer.from('b').toString('base64'));

    expect(proxy.getCallsFor({ path: '/repo/tmp/image.png' })).toStrictEqual([
      ['/repo/tmp/image.png', Buffer.from('a')],
      ['/repo/tmp/image.png', Buffer.from('b')],
    ]);
  });

  describe('predicate addressing', () => {
    it('VALID: {predicate on an images folder} => a computed destination resolves and reads back the decoded bytes', async () => {
      const proxy = writeFileFromBase64Proxy();
      proxy.succeedsMatchingPath({ path: underImages });

      await expect(
        writeFileFromBase64('/home/x/images/abc.png', Buffer.from('hi').toString('base64')),
      ).resolves.toBe(undefined);
      expect(proxy.getCallsFor({ path: underImages })).toStrictEqual([
        ['/home/x/images/abc.png', Buffer.from('hi')],
      ]);
    });

    it('ERROR: {predicate does not match, nothing else staged} => the call throws unstaged', async () => {
      const proxy = writeFileFromBase64Proxy();
      proxy.succeedsMatchingPath({
        path: underImages,
      });

      await expect(writeFileFromBase64('/home/x/other.png', 'aGk=')).rejects.toThrow(/./u);
    });
  });
});
