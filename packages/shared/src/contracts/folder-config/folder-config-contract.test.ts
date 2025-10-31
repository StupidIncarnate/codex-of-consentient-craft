import { FolderConfigStub } from './folder-config.stub';

describe('folderConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: {fileSuffix: string} => parses successfully', () => {
      const config = FolderConfigStub({ fileSuffix: '-broker.ts' });

      expect(config.fileSuffix).toBe('-broker.ts');
    });

    it('VALID: {fileSuffix: string[]} => parses successfully', () => {
      const config = FolderConfigStub({ fileSuffix: ['-contract.ts', '.stub.ts'] });

      expect(config.fileSuffix).toStrictEqual(['-contract.ts', '.stub.ts']);
    });

    it('VALID: {exportCase: camelCase} => parses successfully', () => {
      const config = FolderConfigStub({ exportCase: 'camelCase' });

      expect(config.exportCase).toBe('camelCase');
    });

    it('VALID: {exportCase: PascalCase} => parses successfully', () => {
      const config = FolderConfigStub({ exportCase: 'PascalCase' });

      expect(config.exportCase).toBe('PascalCase');
    });

    it('VALID: {folderDepth: 2} => parses successfully', () => {
      const config = FolderConfigStub({ folderDepth: 2 });

      expect(config.folderDepth).toBe(2);
    });

    it('VALID: {allowsLayerFiles: true} => parses successfully', () => {
      const config = FolderConfigStub({ allowsLayerFiles: true });

      expect(config.allowsLayerFiles).toBe(true);
    });
  });
});
