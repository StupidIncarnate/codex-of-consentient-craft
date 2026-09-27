import { ensureDir } from './ensure-dir';
import { ensureDirProxy } from './ensure-dir.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('ensureDir', () => {
  it('VALID: {path does not exist yet} => creates every missing ancestor and resolves', async () => {
    const proxy = ensureDirProxy();
    proxy.succeeds({ path: '/project/.claude' });

    await expect(ensureDir('/project/.claude')).resolves.toBe(undefined);
  });

  it('ERROR: {no write permission} => rejects with the raw EACCES error', async () => {
    const proxy = ensureDirProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/.claude' });
    proxy.rejects({ path: '/readonly/.claude', error });

    await expect(ensureDir('/readonly/.claude')).rejects.toBe(error);
  });

  it('ERROR: {a path segment is already a file} => rejects with the raw ENOTDIR error', async () => {
    const proxy = ensureDirProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/project/settings.json/nested' });
    proxy.rejects({ path: '/project/settings.json/nested', error });

    await expect(ensureDir('/project/settings.json/nested')).rejects.toBe(error);
  });

  describe('call inspection', () => {
    it('VALID: {two real calls already made} => getCallsFor reads them back', async () => {
      const proxy = ensureDirProxy();
      proxy.succeeds({ path: '/project/.claude' });
      proxy.succeeds({ path: '/project/settings' });

      await ensureDir('/project/.claude');
      await ensureDir('/project/settings');

      expect(proxy.getCallsFor({ path: '/project/.claude' })).toStrictEqual([
        ['/project/.claude', { recursive: true }],
      ]);
      expect(proxy.getCallsFor({ path: '/project/settings' })).toStrictEqual([
        ['/project/settings', { recursive: true }],
      ]);
    });
  });
});
