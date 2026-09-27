import { readlink } from './readlink';
import { readlinkProxy } from './readlink.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

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
      proxy.missing({ path: '/repo/missing' });

      await expect(readlink('/repo/missing')).rejects.toStrictEqual(
        FsErrorStub({ code: 'ENOENT', path: '/repo/missing' }),
      );
    });

    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readlinkProxy();
      proxy.denied({ path: '/repo/locked' });

      await expect(readlink('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });

    it('ERROR: {path: not a symlink} => rejects with the raw EINVAL error', async () => {
      const proxy = readlinkProxy();
      proxy.notALink({ path: '/repo/.dungeonmaster.json' });

      await expect(readlink('/repo/.dungeonmaster.json')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EINVAL', path: '/repo/.dungeonmaster.json' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readlinkProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('orchestrator'),
        target: '../../../packages/orchestrator',
      });

      const result = await readlink('/resolved/at/runtime/orchestrator');

      expect(result).toBe('../../../packages/orchestrator');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readlinkProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      await expect(readlink('/resolved/at/runtime/missing')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readlinkProxy();
      proxy.returns({
        path: '/worktree/node_modules/@dungeonmaster/orchestrator',
        target: '../../../packages/orchestrator',
      });

      await readlink('/worktree/node_modules/@dungeonmaster/orchestrator');

      expect(
        proxy.getCallsFor({ path: '/worktree/node_modules/@dungeonmaster/orchestrator' }),
      ).toStrictEqual([['/worktree/node_modules/@dungeonmaster/orchestrator']]);
    });
  });
});
