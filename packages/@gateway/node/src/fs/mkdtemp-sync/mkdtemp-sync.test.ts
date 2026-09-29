import { mkdtempSync } from './mkdtemp-sync';
import { mkdtempSyncProxy } from './mkdtemp-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('mkdtempSync', () => {
  it('VALID: {prefix} => returns the directory Node created for that prefix', () => {
    const proxy = mkdtempSyncProxy();
    proxy.returns({ prefix: '/tmp/dm-e2e-images-', dir: '/tmp/dm-e2e-images-a1B2c3' });

    expect(mkdtempSync('/tmp/dm-e2e-images-')).toBe('/tmp/dm-e2e-images-a1B2c3');
  });

  it('VALID: {prefix} => calls Node with the prefix alone', () => {
    const proxy = mkdtempSyncProxy();
    proxy.returns({ prefix: '/tmp/dm-e2e-images-', dir: '/tmp/dm-e2e-images-a1B2c3' });

    mkdtempSync('/tmp/dm-e2e-images-');

    expect(proxy.getCallsFor({ prefix: '/tmp/dm-e2e-images-' })).toStrictEqual([
      ['/tmp/dm-e2e-images-'],
    ]);
  });

  it('ERROR: {prefix under a missing parent, ENOENT} => throws the raw error', () => {
    const proxy = mkdtempSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/missing/dm-e2e-images-XXXXXX' });
    proxy.throws({ prefix: '/missing/dm-e2e-images-', error });

    expect(() => mkdtempSync('/missing/dm-e2e-images-')).toThrow(error);
  });

  it('ERROR: {prefix under an unwritable parent, EACCES} => throws the raw error', () => {
    const proxy = mkdtempSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/readonly/dm-e2e-images-XXXXXX' });
    proxy.throws({ prefix: '/readonly/dm-e2e-images-', error });

    expect(() => mkdtempSync('/readonly/dm-e2e-images-')).toThrow(error);
  });
});
