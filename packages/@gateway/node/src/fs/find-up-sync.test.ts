import { findUpSync } from './find-up-sync';
import { findUpSyncProxy } from './find-up-sync.proxy';
import { join } from 'path';

describe('findUpSync', () => {
  it('VALID: {startDir: a directory holding fileName} => returns the match in that directory', () => {
    const proxy = findUpSyncProxy();
    proxy.foundAt({ path: join('/repo/packages/node/src', 'package.json') });

    expect(findUpSync({ startDir: '/repo/packages/node/src', fileName: 'package.json' })).toBe(
      join('/repo/packages/node/src', 'package.json'),
    );
  });

  it('VALID: {startDir: a directory below the match} => walks up and returns the ancestor match', () => {
    const proxy = findUpSyncProxy();
    proxy.notFound({ path: join('/repo/packages/node/src', 'package.json') });
    proxy.foundAt({ path: join('/repo/packages/node', 'package.json') });

    expect(findUpSync({ startDir: '/repo/packages/node/src', fileName: 'package.json' })).toBe(
      join('/repo/packages/node', 'package.json'),
    );
  });

  it('EMPTY: {startDir: no ancestor holds fileName all the way to the root} => returns null', () => {
    const proxy = findUpSyncProxy();
    proxy.notFound({ path: join('/repo/packages/node/src', 'package.json') });
    proxy.notFound({ path: join('/repo/packages/node', 'package.json') });
    proxy.notFound({ path: join('/repo/packages', 'package.json') });
    proxy.notFound({ path: join('/repo', 'package.json') });
    proxy.notFound({ path: join('/', 'package.json') });

    expect(findUpSync({ startDir: '/repo/packages/node/src', fileName: 'package.json' })).toBe(
      null,
    );
  });
});
