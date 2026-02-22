import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsMkdirAdapter', () => {
  it('VALID: {filepath: "/path/to/dir"} => creates directory successfully', async () => {
    const adapterProxy = fsMkdirAdapterProxy();
    const filepath = FilePathStub({ value: '/path/to/quests' });

    adapterProxy.succeeds({ filepath });

    await expect(fsMkdirAdapter({ filepath })).resolves.toBeUndefined();
  });

  it('ERROR: {filepath: "/readonly/dir"} => throws error', async () => {
    const adapterProxy = fsMkdirAdapterProxy();
    const filepath = FilePathStub({ value: '/readonly/dir' });
    const expectedError = new Error('Permission denied');

    adapterProxy.throws({ filepath, error: expectedError });

    await expect(fsMkdirAdapter({ filepath })).rejects.toThrow('Permission denied');
  });
});
