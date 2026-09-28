import { rename } from './rename';
import { renameProxy } from './rename.proxy';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

describe('rename', () => {
  it('VALID: {from, to} => renames the path and resolves', async () => {
    const proxy = renameProxy();
    proxy.succeeds({ from: '/repo/tmp/a.json.tmp', to: '/repo/tmp/a.json' });

    await expect(rename('/repo/tmp/a.json.tmp', '/repo/tmp/a.json')).resolves.toBe(undefined);
  });

  it('ERROR: {from does not exist} => rejects with the raw ENOENT error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/tmp/missing.tmp' });
    proxy.rejects({ from: '/repo/tmp/missing.tmp', to: '/repo/tmp/a.json', error });

    await expect(rename('/repo/tmp/missing.tmp', '/repo/tmp/a.json')).rejects.toBe(error);
  });

  it('ERROR: {cross-device rename} => rejects with the raw EXDEV error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'EXDEV', path: '/repo/tmp/a.json.tmp' });
    proxy.rejects({ from: '/repo/tmp/a.json.tmp', to: '/mnt/other/a.json', error });

    await expect(rename('/repo/tmp/a.json.tmp', '/mnt/other/a.json')).rejects.toBe(error);
  });

  it('ERROR: {destination is a non-empty directory} => rejects with the raw ENOTEMPTY error', async () => {
    const proxy = renameProxy();
    const error = FsErrorStub({ code: 'ENOTEMPTY', path: '/repo/tmp/dir' });
    proxy.rejects({ from: '/repo/tmp/other-dir', to: '/repo/tmp/dir', error });

    await expect(rename('/repo/tmp/other-dir', '/repo/tmp/dir')).rejects.toBe(error);
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads it back', async () => {
      const proxy = renameProxy();
      proxy.succeeds({ from: '/repo/tmp/registry.json.tmp', to: '/repo/tmp/registry.json' });

      await rename('/repo/tmp/registry.json.tmp', '/repo/tmp/registry.json');

      expect(
        proxy.getCallsFor({
          from: '/repo/tmp/registry.json.tmp',
          to: '/repo/tmp/registry.json',
        }),
      ).toStrictEqual([['/repo/tmp/registry.json.tmp', '/repo/tmp/registry.json']]);
    });

    it('VALID: {a predicate on the destination} => getCallsFor reads back a call the predicate accepts', async () => {
      const proxy = renameProxy();
      proxy.succeeds({ from: '/repo/tmp/a.json.tmp', to: '/repo/tmp/a.json' });

      await rename('/repo/tmp/a.json.tmp', '/repo/tmp/a.json');

      expect(
        proxy.getCallsFor({
          from: '/repo/tmp/a.json.tmp',
          to: (value) => String(value).endsWith('a.json'),
        }),
      ).toStrictEqual([['/repo/tmp/a.json.tmp', '/repo/tmp/a.json']]);
    });
  });
});
