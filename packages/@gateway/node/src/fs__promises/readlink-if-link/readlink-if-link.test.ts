import { readlinkIfLink } from './readlink-if-link';
import { readlinkIfLinkProxy } from './readlink-if-link.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('readlinkIfLink', () => {
  describe('successful reads', () => {
    it('VALID: {path: a symlink} => returns its stored target', async () => {
      const proxy = readlinkIfLinkProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster-assets/siegelense-assets',
        target: '/home/user/.dungeonmaster/siegelense',
      });

      const result = await readlinkIfLink('/repo/.dungeonmaster-assets/siegelense-assets');

      expect(result).toBe('/home/user/.dungeonmaster/siegelense');
    });
  });

  describe('missing path', () => {
    it('EMPTY: {path: missing} => returns null instead of throwing', async () => {
      const proxy = readlinkIfLinkProxy();
      proxy.missing({ path: '/repo/missing' });

      const result = await readlinkIfLink('/repo/missing');

      expect(result).toBe(null);
    });
  });

  describe('not a link', () => {
    it('EDGE: {path: not a symlink} => returns null on EINVAL', async () => {
      const proxy = readlinkIfLinkProxy();
      proxy.notALink({ path: '/repo/.dungeonmaster.json' });

      const result = await readlinkIfLink('/repo/.dungeonmaster.json');

      expect(result).toBe(null);
    });
  });

  describe('sad paths', () => {
    it('ERROR: {path: permission denied} => rejects with the raw EACCES error', async () => {
      const proxy = readlinkIfLinkProxy();
      const error = FsErrorStub({ code: 'EACCES' });
      proxy.rejects({ path: '/repo/locked', error });

      await expect(readlinkIfLink('/repo/locked')).rejects.toBe(error);
    });
  });
});
