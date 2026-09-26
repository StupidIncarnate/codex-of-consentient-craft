import { ensureDirSync } from './ensure-dir-sync';
import { ensureDirSyncProxy } from './ensure-dir-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

describe('ensureDirSync', () => {
  it('VALID: {path: a nested path with missing segments} => calls mkdirSync recursively', () => {
    const proxy = ensureDirSyncProxy();
    proxy.succeeds({ path: '/tmp/a/b/c' });

    ensureDirSync('/tmp/a/b/c');

    expect(proxy.calls({ path: '/tmp/a/b/c' })).toStrictEqual([
      ['/tmp/a/b/c', { recursive: true }],
    ]);
  });

  it('ERROR: {path: an unwritable parent, EACCES} => throws the raw error', () => {
    const proxy = ensureDirSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/root/locked' });
    proxy.throws({ path: '/root/locked', error });

    expect(() => {
      ensureDirSync('/root/locked');
    }).toThrow(error);
  });

  it('ERROR: {path: through a non-directory segment, ENOTDIR} => throws the raw error', () => {
    const proxy = ensureDirSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/tmp/afile/child' });
    proxy.throws({ path: '/tmp/afile/child', error });

    expect(() => {
      ensureDirSync('/tmp/afile/child');
    }).toThrow(error);
  });
});
