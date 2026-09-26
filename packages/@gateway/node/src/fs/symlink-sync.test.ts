import { symlinkSync } from './symlink-sync';
import { symlinkSyncProxy } from './symlink-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

describe('symlinkSync', () => {
  it('VALID: {target, path} => creates the symlink', () => {
    const proxy = symlinkSyncProxy();
    proxy.succeeds({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
    });

    symlinkSync({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
    });

    expect(
      proxy.calls({
        target: '../../packages/orchestrator',
        path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
      }),
    ).toStrictEqual([
      [
        '../../packages/orchestrator',
        '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
        undefined,
      ],
    ]);
  });

  it('ERROR: {path already exists, EEXIST} => throws the raw error', () => {
    const proxy = symlinkSyncProxy();
    const error = FsErrorStub({ code: 'EEXIST', path: '/worktrees/quest-slug/node_modules/pkg' });
    proxy.throws({
      target: '../../packages/pkg',
      path: '/worktrees/quest-slug/node_modules/pkg',
      error,
    });

    expect(() => {
      symlinkSync({ target: '../../packages/pkg', path: '/worktrees/quest-slug/node_modules/pkg' });
    }).toThrow(error);
  });

  it('ERROR: {missing parent folder, ENOENT} => throws the raw error', () => {
    const proxy = symlinkSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/node_modules/pkg' });
    proxy.throws({ target: '../../packages/pkg', path: '/missing/node_modules/pkg', error });

    expect(() => {
      symlinkSync({ target: '../../packages/pkg', path: '/missing/node_modules/pkg' });
    }).toThrow(error);
  });
});
