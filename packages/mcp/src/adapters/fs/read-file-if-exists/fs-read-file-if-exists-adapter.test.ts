import { fsReadFileIfExistsAdapter } from './fs-read-file-if-exists-adapter';
import { fsReadFileIfExistsAdapterProxy } from './fs-read-file-if-exists-adapter.proxy';
import { FileContentsStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('fsReadFileIfExistsAdapter', () => {
  it('VALID: {filepath: "/repo/.gitignore"} => returns the file contents', async () => {
    const adapterProxy = fsReadFileIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/repo/.gitignore' });
    const contents = FileContentsStub({ value: 'dist\nworktrees/\n' });

    adapterProxy.returnsFor({ filepath, contents });

    const result = await fsReadFileIfExistsAdapter({ filepath });

    expect(result).toBe('dist\nworktrees/\n');
  });

  it('EMPTY: {filepath: missing file} => returns undefined', async () => {
    const adapterProxy = fsReadFileIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/repo/.gitignore' });

    adapterProxy.missingFor({ filepath });

    const result = await fsReadFileIfExistsAdapter({ filepath });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {filepath: empty file} => returns empty contents', async () => {
    const adapterProxy = fsReadFileIfExistsAdapterProxy();
    const filepath = PathSegmentStub({ value: '/repo/.gitignore' });

    adapterProxy.returnsFor({ filepath, contents: FileContentsStub({ value: '' }) });

    const result = await fsReadFileIfExistsAdapter({ filepath });

    expect(result).toBe('');
  });
});
