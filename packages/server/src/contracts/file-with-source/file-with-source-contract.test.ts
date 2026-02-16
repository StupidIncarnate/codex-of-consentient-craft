import { fileWithSourceContract as _fileWithSourceContract } from './file-with-source-contract';
import { FileWithSourceStub } from './file-with-source.stub';

describe('fileWithSourceContract', () => {
  describe('valid files', () => {
    it('VALID: {filepath, source: project, basePath} => parses successfully', () => {
      const result = FileWithSourceStub({
        filepath: '/home/user/project/src/brokers/user-broker.ts',
        source: 'project',
        basePath: '/home/user/project',
      });

      expect(result).toStrictEqual({
        filepath: '/home/user/project/src/brokers/user-broker.ts',
        source: 'project',
        basePath: '/home/user/project',
      });
    });

    it('VALID: {filepath, source: shared, basePath} => parses successfully', () => {
      const result = FileWithSourceStub({
        filepath: '/node_modules/@dungeonmaster/shared/src/adapters/fs-adapter.ts',
        source: 'shared',
        basePath: '/node_modules/@dungeonmaster/shared/src',
      });

      expect(result).toStrictEqual({
        filepath: '/node_modules/@dungeonmaster/shared/src/adapters/fs-adapter.ts',
        source: 'shared',
        basePath: '/node_modules/@dungeonmaster/shared/src',
      });
    });
  });
});
