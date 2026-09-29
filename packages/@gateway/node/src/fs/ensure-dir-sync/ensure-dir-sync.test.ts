import { ensureDirSync } from './ensure-dir-sync';
import { ensureDirSyncProxy } from './ensure-dir-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

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

  it('VALID: {succeedsUnder a root} => the root and a nested path succeed, a sibling path hits the trap', () => {
    const proxy = ensureDirSyncProxy();
    proxy.succeedsUnder({ root: '/tmp/project' });

    ensureDirSync('/tmp/project');
    ensureDirSync('/tmp/project/a/b');

    expect({
      rootCalls: proxy.calls({ path: '/tmp/project' }),
      nestedCalls: proxy.calls({ path: '/tmp/project/a/b' }),
    }).toStrictEqual({
      rootCalls: [['/tmp/project', { recursive: true }]],
      nestedCalls: [['/tmp/project/a/b', { recursive: true }]],
    });
    expect(() => {
      ensureDirSync('/tmp/project-other');
    }).toThrow(
      /^registerMock: nothing set up for the call mockConstructor\("\/tmp\/project-other"/u,
    );
  });
});
