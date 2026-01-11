import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fsMkdirAdapter', () => {
  describe('successful creation', () => {
    it('VALID: {filepath: "/path/to/dir"} => creates directory successfully', async () => {
      const proxy = fsMkdirAdapterProxy();
      const filepath = FilePathStub({ value: '/path/to/quests' });

      proxy.succeeds({ filepath });

      await expect(fsMkdirAdapter({ filepath })).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {filepath: "/readonly/dir"} => throws permission error', async () => {
      const proxy = fsMkdirAdapterProxy();
      const filepath = FilePathStub({ value: '/readonly/dir' });
      const expectedError = new Error('Permission denied');

      proxy.throws({ filepath, error: expectedError });

      await expect(fsMkdirAdapter({ filepath })).rejects.toThrow('Permission denied');
    });
  });
});
