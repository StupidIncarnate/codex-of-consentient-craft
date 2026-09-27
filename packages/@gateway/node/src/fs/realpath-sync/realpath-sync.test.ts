import { realpathSync } from './realpath-sync';
import { realpathSyncProxy } from './realpath-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('realpathSync', () => {
  describe('successful reads', () => {
    it('VALID: {path: a chain of symlinks} => returns the fully resolved path', () => {
      const proxy = realpathSyncProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster-assets/siegelense-assets',
        resolved: '/home/user/.dungeonmaster/siegelense',
      });

      expect(realpathSync('/repo/.dungeonmaster-assets/siegelense-assets')).toBe(
        '/home/user/.dungeonmaster/siegelense',
      );
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: missing, ENOENT} => throws the raw error', () => {
      const proxy = realpathSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/repo/missing' });
      proxy.throws({ path: '/repo/missing', error });

      expect(() => realpathSync('/repo/missing')).toThrow(error);
    });

    it('ERROR: {path: permission denied, EACCES} => throws the raw error', () => {
      const proxy = realpathSyncProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/repo/locked' });
      proxy.throws({ path: '/repo/locked', error });

      expect(() => realpathSync('/repo/locked')).toThrow(error);
    });

    it('ERROR: {path: a symlink loop, ELOOP} => throws the raw error', () => {
      const proxy = realpathSyncProxy();
      const error = FsErrorStub({ code: 'ELOOP', path: '/repo/looped-link' });
      proxy.throws({ path: '/repo/looped-link', error });

      expect(() => realpathSync('/repo/looped-link')).toThrow(error);
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', () => {
      const proxy = realpathSyncProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('siegelense-assets'),
        resolved: '/home/user/.dungeonmaster/siegelense',
      });

      expect(realpathSync('/resolved/at/runtime/siegelense-assets')).toBe(
        '/home/user/.dungeonmaster/siegelense',
      );
    });

    it('ERROR: {throwsMatchingPath, a predicate} => throws the staged error', () => {
      const proxy = realpathSyncProxy();
      const error = FsErrorStub({ code: 'ENOENT', path: '/resolved/at/runtime/missing' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('missing'),
        error,
      });

      expect(() => realpathSync('/resolved/at/runtime/missing')).toThrow(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', () => {
      const proxy = realpathSyncProxy();
      proxy.returns({ path: '/repo/link', resolved: '/repo/real' });

      realpathSync('/repo/link');

      expect(proxy.getCallsFor({ path: '/repo/link' })).toStrictEqual([['/repo/link']]);
    });
  });
});
