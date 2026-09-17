import { FilePathStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';
import { fsSymlinkAdapter } from './fs-symlink-adapter';
import { fsSymlinkAdapterProxy } from './fs-symlink-adapter.proxy';

describe('fsSymlinkAdapter', () => {
  it('VALID: creates symlink successfully', async () => {
    const proxy = fsSymlinkAdapterProxy();
    const target = PathSegmentStub({ value: 'CLAUDE.md' });
    const linkPath = FilePathStub({ value: '/test/repo/AGENTS.md' });

    proxy.succeeds({ target });

    const result = await fsSymlinkAdapter({ target, linkPath });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getLinkPathFor({ target })).toBe(linkPath);
  });

  it('ERROR: symlink failure propagates rejection', async () => {
    const proxy = fsSymlinkAdapterProxy();
    const target = PathSegmentStub({ value: 'CLAUDE.md' });
    const linkPath = FilePathStub({ value: '/test/repo/AGENTS.md' });

    proxy.throws({ target, error: new Error('EEXIST: file already exists') });

    await expect(fsSymlinkAdapter({ target, linkPath })).rejects.toThrow(
      /^EEXIST: file already exists$/u,
    );
  });
});
