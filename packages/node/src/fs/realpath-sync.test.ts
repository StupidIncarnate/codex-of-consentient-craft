import { realpathSync } from './realpath-sync';
import { realpathSyncProxy } from './realpath-sync.proxy';
import { FsErrorStub } from './fs-error.stub';

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
});
