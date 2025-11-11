import { fsStatAdapter } from './fs-stat-adapter';
import { fsStatAdapterProxy } from './fs-stat-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileStatsStub } from '../../../contracts/file-stats/file-stats.stub';

describe('fsStatAdapter', () => {
  it('VALID: {filePath} => returns file stats', async () => {
    const proxy = fsStatAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.ts' });
    const mockStats = FileStatsStub({ size: 1024 });
    proxy.returns({ stats: mockStats });

    const result = await fsStatAdapter({ filePath });

    expect(result).toStrictEqual(mockStats);
  });

  it('ERROR: {filePath} => throws error when stat fails', async () => {
    const proxy = fsStatAdapterProxy();
    const filePath = FilePathStub({ value: '/test/file.ts' });
    const mockError = new Error('File not found');
    proxy.throws({ error: mockError });

    await expect(fsStatAdapter({ filePath })).rejects.toThrow(/Failed to stat file at/u);
  });
});
