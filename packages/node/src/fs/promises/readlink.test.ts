import { readlink } from './readlink';
import { readlinkProxy } from './readlink.proxy';
import { FsErrorStub } from '../fs-error.stub';

describe('readlink', () => {
  describe('successful reads', () => {
    it('VALID: {path: a symlink} => returns its stored, unresolved target', async () => {
      const proxy = readlinkProxy();
      proxy.returns({
        path: '/worktree/node_modules/@dungeonmaster/orchestrator',
        target: '../../../packages/orchestrator',
      });

      const result = await readlink('/worktree/node_modules/@dungeonmaster/orchestrator');

      expect(result).toBe('../../../packages/orchestrator');
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing} => rejects with the raw ENOENT error', async () => {
      const proxy = readlinkProxy();
      const error = FsErrorStub({ code: 'ENOENT' });
      proxy.rejects({ path: '/repo/missing', error });

      await expect(readlink('/repo/missing')).rejects.toBe(error);
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readlinkProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(readlink('/repo/locked')).rejects.toBe(error);
    });

    it('ERROR: {path: not a symlink} => rejects with the raw EINVAL error', async () => {
      const proxy = readlinkProxy();
      const error = FsErrorStub({ code: 'EINVAL' });
      proxy.rejects({ path: '/repo/.dungeonmaster.json', error });

      await expect(readlink('/repo/.dungeonmaster.json')).rejects.toBe(error);
    });
  });
});
