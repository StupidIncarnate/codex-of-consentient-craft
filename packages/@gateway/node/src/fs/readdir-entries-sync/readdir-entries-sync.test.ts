import { readdirEntriesSync } from './readdir-entries-sync';
import { readdirEntriesSyncProxy } from './readdir-entries-sync.proxy';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

describe('readdirEntriesSync', () => {
  it('VALID: {path: directory with mixed entry kinds} => returns each name paired with its kind', () => {
    const proxy = readdirEntriesSyncProxy();
    proxy.returns({
      path: '/repo/.dungeonmaster',
      entries: [
        { name: 'config.json', kind: 'file' },
        { name: 'quests', kind: 'directory' },
        { name: 'link', kind: 'symlink' },
      ],
    });

    expect(readdirEntriesSync('/repo/.dungeonmaster')).toStrictEqual([
      { name: 'config.json', kind: 'file' },
      { name: 'quests', kind: 'directory' },
      { name: 'link', kind: 'symlink' },
    ]);
  });

  it('EMPTY: {path: an empty directory} => returns an empty array', () => {
    const proxy = readdirEntriesSyncProxy();
    proxy.returns({ path: '/repo/.dungeonmaster', entries: [] });

    expect(readdirEntriesSync('/repo/.dungeonmaster')).toStrictEqual([]);
  });

  it('ERROR: {path: missing} => throws the raw ENOENT error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'ENOENT', path: '/repo/missing' });
    proxy.throws({ path: '/repo/missing', error });

    expect(() => readdirEntriesSync('/repo/missing')).toThrow(error);
  });

  it('ERROR: {path: permission denied} => throws the raw EACCES error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'EACCES', path: '/repo/locked' });
    proxy.throws({ path: '/repo/locked', error });

    expect(() => readdirEntriesSync('/repo/locked')).toThrow(error);
  });

  it('ERROR: {path: a parent segment that is a file} => throws the raw ENOTDIR error', () => {
    const proxy = readdirEntriesSyncProxy();
    const error = FsErrorStub({ code: 'ENOTDIR', path: '/repo/.dungeonmaster.json/nested' });
    proxy.throws({ path: '/repo/.dungeonmaster.json/nested', error });

    expect(() => readdirEntriesSync('/repo/.dungeonmaster.json/nested')).toThrow(error);
  });
});
