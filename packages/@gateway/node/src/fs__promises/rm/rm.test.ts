import { rm } from './rm';
import { rmProxy } from './rm.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

const underQuests = (value: unknown): boolean =>
  typeof value === 'string' && value.includes('/quests/');

describe('rm', () => {
  it('VALID: {path, recursive: true, force: true} => removes the tree and resolves', async () => {
    const proxy = rmProxy();
    proxy.succeeds({ path: '/repo/tmp/scratch' });

    await expect(rm('/repo/tmp/scratch', { recursive: true, force: true })).resolves.toBe(
      undefined,
    );
  });

  it('ERROR: {path does not exist, force omitted} => rejects with the raw ENOENT error', async () => {
    const proxy = rmProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/missing' });
    proxy.rejects({ path: '/repo/tmp/missing', error });

    await expect(rm('/repo/tmp/missing')).rejects.toBe(error);
  });

  it('ERROR: {no write permission} => rejects with the raw EACCES error', async () => {
    const proxy = rmProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/scratch' });
    proxy.rejects({ path: '/readonly/scratch', error });

    await expect(rm('/readonly/scratch', { recursive: true })).rejects.toBe(error);
  });

  describe('call inspection', () => {
    it('VALID: {recursive and force both true} => getCallsFor reads back the exact [path, options] tuple', async () => {
      const proxy = rmProxy();
      proxy.succeeds({ path: '/repo/tmp/scratch' });

      await rm('/repo/tmp/scratch', { recursive: true, force: true });

      expect(proxy.getCallsFor({ path: '/repo/tmp/scratch' })).toStrictEqual([
        ['/repo/tmp/scratch', { recursive: true, force: true }],
      ]);
    });
  });

  describe('predicate addressing', () => {
    it('VALID: {predicate on a quests folder} => a computed path under it resolves and reads back', async () => {
      const proxy = rmProxy();
      proxy.succeedsMatchingPath({ path: underQuests });

      await expect(
        rm('/home/x/guilds/g1/quests/q1', { recursive: true, force: true }),
      ).resolves.toBe(undefined);
      expect(proxy.getCallsFor({ path: underQuests })).toStrictEqual([
        ['/home/x/guilds/g1/quests/q1', { recursive: true, force: true }],
      ]);
    });

    it('ERROR: {predicate rejects} => a matching path rejects with the raw error', async () => {
      const proxy = rmProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/home/x/guilds/g1/quests/q1' });
      proxy.rejectsMatchingPath({
        path: underQuests,
        error,
      });

      await expect(rm('/home/x/guilds/g1/quests/q1', { recursive: true })).rejects.toBe(error);
    });

    it('ERROR: {predicate does not match, nothing else staged} => the call throws unstaged', async () => {
      const proxy = rmProxy();
      proxy.succeedsMatchingPath({
        path: underQuests,
      });

      await expect(rm('/home/x/elsewhere')).rejects.toThrow(/./u);
    });
  });
});
