import { writeFileBytesSync } from './write-file-bytes-sync';
import { writeFileBytesSyncProxy } from './write-file-bytes-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('writeFileBytesSync', () => {
  it('VALID: {path, bytes} => writes the bytes as-is', () => {
    const proxy = writeFileBytesSyncProxy();
    proxy.succeeds({ path: '/tmp/fixture/a.png' });
    const bytes = new Uint8Array([137, 80, 78, 71]);

    writeFileBytesSync('/tmp/fixture/a.png', bytes);

    expect(proxy.writtenBytesFor({ path: '/tmp/fixture/a.png' })).toBe(bytes);
  });

  it('VALID: {path, bytes} => calls Node with no encoding argument', () => {
    const proxy = writeFileBytesSyncProxy();
    proxy.succeeds({ path: '/tmp/fixture/a.png' });
    const bytes = new Uint8Array([1, 2, 3]);

    writeFileBytesSync('/tmp/fixture/a.png', bytes);

    expect(proxy.getCallsFor({ path: '/tmp/fixture/a.png' })).toStrictEqual([
      ['/tmp/fixture/a.png', bytes],
    ]);
  });

  it('ERROR: {path: a missing parent directory, ENOENT} => throws the raw error', () => {
    const proxy = writeFileBytesSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/tmp/nodir/a.png' });
    proxy.throws({ path: '/tmp/nodir/a.png', error });

    expect(() => {
      writeFileBytesSync('/tmp/nodir/a.png', new Uint8Array());
    }).toThrow(error);
  });

  it('ERROR: {path: a directory, EISDIR} => throws the raw error', () => {
    const proxy = writeFileBytesSyncProxy();
    const error = FsErrorStub({ code: 'EISDIR', path: '/tmp/adir' });
    proxy.throws({ path: '/tmp/adir', error });

    expect(() => {
      writeFileBytesSync('/tmp/adir', new Uint8Array());
    }).toThrow(error);
  });
});
