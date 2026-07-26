import { PathSegmentStub } from '@dungeonmaster/shared/contracts';

import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import { fsReaddirIfExistsAdapter } from './fs-readdir-if-exists-adapter';
import { fsReaddirIfExistsAdapterProxy } from './fs-readdir-if-exists-adapter.proxy';

describe('fsReaddirIfExistsAdapter', () => {
  it('VALID: {existing dir with entries} => returns FolderName[] of basenames', async () => {
    const proxy = fsReaddirIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/home/u/.claude/projects/-foo' });
    proxy.returns({
      filepath,
      entries: [FolderNameStub({ value: 'abc-123.jsonl' }), FolderNameStub({ value: 'README.md' })],
    });

    const result = await fsReaddirIfExistsAdapter({ filepath });

    expect(result).toStrictEqual([
      FolderNameStub({ value: 'abc-123.jsonl' }),
      FolderNameStub({ value: 'README.md' }),
    ]);
  });

  it('EMPTY: {existing empty dir} => returns empty array', async () => {
    const proxy = fsReaddirIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/home/u/.claude/projects/-foo' });
    proxy.returns({ filepath, entries: [] });

    const result = await fsReaddirIfExistsAdapter({ filepath });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {dir does not exist} => returns undefined', async () => {
    const proxy = fsReaddirIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/home/u/.claude/projects/-missing' });
    proxy.returnsUndefined({ filepath });

    const result = await fsReaddirIfExistsAdapter({ filepath });

    expect(result).toBe(undefined);
  });
});
