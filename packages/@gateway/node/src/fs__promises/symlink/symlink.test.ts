import { symlink } from './symlink';
import { symlinkProxy } from './symlink.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('symlink', () => {
  it('VALID: {target, path} => creates the symlink and resolves', async () => {
    const proxy = symlinkProxy();
    proxy.succeeds({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
    });

    await expect(
      symlink({
        target: '../../packages/orchestrator',
        path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
      }),
    ).resolves.toBe(undefined);
  });

  it('ERROR: {path already exists} => rejects with the raw EEXIST error', async () => {
    const proxy = symlinkProxy();
    const error = FsErrorStub({ code: 'EEXIST', path: '/worktrees/quest-slug/node_modules/pkg' });
    proxy.rejects({
      target: '../../packages/pkg',
      path: '/worktrees/quest-slug/node_modules/pkg',
      error,
    });

    await expect(
      symlink({ target: '../../packages/pkg', path: '/worktrees/quest-slug/node_modules/pkg' }),
    ).rejects.toBe(error);
  });

  it('ERROR: {missing parent folder} => rejects with the raw ENOENT error', async () => {
    const proxy = symlinkProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/node_modules/pkg' });
    proxy.rejects({ target: '../../packages/pkg', path: '/missing/node_modules/pkg', error });

    await expect(
      symlink({ target: '../../packages/pkg', path: '/missing/node_modules/pkg' }),
    ).rejects.toBe(error);
  });

  it('VALID: {two calls to the same target and path} => getCallsFor reads back each call in order', async () => {
    const proxy = symlinkProxy();
    proxy.succeeds({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
    });

    await symlink({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
      type: 'dir',
    });
    await symlink({
      target: '../../packages/orchestrator',
      path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
    });

    expect(
      proxy.getCallsFor({
        target: '../../packages/orchestrator',
        path: '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
      }),
    ).toStrictEqual([
      [
        '../../packages/orchestrator',
        '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
        'dir',
      ],
      [
        '../../packages/orchestrator',
        '/worktrees/quest-slug/node_modules/@dungeonmaster/orchestrator',
        undefined,
      ],
    ]);
  });
});
