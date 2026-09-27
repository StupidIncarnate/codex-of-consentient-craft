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
      proxy.denied({ path: '/repo/locked' });

      await expect(readlinkIfLink('/repo/locked')).rejects.toStrictEqual(
        FsErrorStub({ code: 'EACCES', path: '/repo/locked' }),
      );
    });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingPath, a predicate} => resolves for a path the predicate accepts', async () => {
      const proxy = readlinkIfLinkProxy();
      proxy.returnsMatchingPath({
        path: (value) => String(value).endsWith('siegelense-assets'),
        target: '/home/user/.dungeonmaster/siegelense',
      });

      const result = await readlinkIfLink('/resolved/at/runtime/siegelense-assets');

      expect(result).toBe('/home/user/.dungeonmaster/siegelense');
    });

    it('ERROR: {throwsMatchingPath, a predicate} => rejects with the staged error', async () => {
      const proxy = readlinkIfLinkProxy();
      const error = FsErrorStub({ code: 'EACCES', path: '/resolved/at/runtime/locked' });
      proxy.throwsMatchingPath({
        path: (value) => String(value).endsWith('locked'),
        error,
      });

      await expect(readlinkIfLink('/resolved/at/runtime/locked')).rejects.toStrictEqual(error);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = readlinkIfLinkProxy();
      proxy.returns({
        path: '/repo/.dungeonmaster-assets/siegelense-assets',
        target: '/home/user/.dungeonmaster/siegelense',
      });

      await readlinkIfLink('/repo/.dungeonmaster-assets/siegelense-assets');

      expect(
        proxy.getCallsFor({ path: '/repo/.dungeonmaster-assets/siegelense-assets' }),
      ).toStrictEqual([['/repo/.dungeonmaster-assets/siegelense-assets']]);
    });
  });
});
