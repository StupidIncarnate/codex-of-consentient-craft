import { fileReadOrEmptyBroker } from './file-read-or-empty-broker';
import { fileReadOrEmptyBrokerProxy } from './file-read-or-empty-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('fileReadOrEmptyBroker', () => {
  describe('valid input', () => {
    it('VALID: {filePath: existing file} => returns file content', async () => {
      const proxy = fileReadOrEmptyBrokerProxy();
      const filePath = FilePathStub({ value: '/path/to/file.ts' });
      const content = 'const x = 1;';

      proxy.setupFileExists({ content });

      const result = await fileReadOrEmptyBroker({ filePath });

      expect(result).toBe('const x = 1;');
    });
  });

  describe('error handling', () => {
    it('ERROR: {filePath: nonexistent file} => returns empty string', async () => {
      const proxy = fileReadOrEmptyBrokerProxy();
      const filePath = FilePathStub({ value: '/nonexistent/file.ts' });

      proxy.setupFileNotFound();

      const result = await fileReadOrEmptyBroker({ filePath });

      expect(result).toBe('');
    });

    it('ERROR: {filePath: permission denied} => throws error', async () => {
      const proxy = fileReadOrEmptyBrokerProxy();
      const filePath = FilePathStub({ value: '/forbidden/file.ts' });
      const permissionError = new Error('EACCES: permission denied') as NodeJS.ErrnoException;
      permissionError.code = 'EACCES';

      proxy.setupFileError({ error: permissionError });

      await expect(fileReadOrEmptyBroker({ filePath })).rejects.toThrow(
        'EACCES: permission denied',
      );
    });
  });
});
