import { folderConfigContract } from './folder-config-contract';
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

    it('VALID: {requireContractDeclarations: true} => parses successfully', () => {
      const config = FolderConfigStub({ requireContractDeclarations: true });

      expect(config.requireContractDeclarations).toBe(true);
    });

    it('VALID: {requireContractDeclarations: false} => parses successfully', () => {
      const config = FolderConfigStub({ requireContractDeclarations: false });

      expect(config.requireContractDeclarations).toBe(false);
    });

    it('VALID: {testType: unit} => parses successfully', () => {
      const config = FolderConfigStub({ testType: 'unit' });

      expect(config.testType).toBe('unit');
    });

    it('VALID: {testType: integration} => parses successfully', () => {
      const config = FolderConfigStub({ testType: 'integration' });

      expect(config.testType).toBe('integration');
    });

    it('VALID: {testType: none} => parses successfully', () => {
      const config = FolderConfigStub({ testType: 'none' });

      expect(config.testType).toBe('none');
    });

    it('VALID: {requireStub: true} => parses successfully', () => {
      const config = FolderConfigStub({ requireStub: true });

      expect(config.requireStub).toBe(true);
    });

    it('VALID: {requireStub: false} => parses successfully', () => {
      const config = FolderConfigStub({ requireStub: false });

      expect(config.requireStub).toBe(false);
    });
  });

  describe('invalid configs', () => {
    it('INVALID: {testType: "unknown"} => throws validation error', () => {
      const parseInvalidTestType = (): unknown =>
        folderConfigContract.parse({
          ...FolderConfigStub(),
          testType: 'unknown',
        });

      expect(parseInvalidTestType).toThrow(/Invalid enum value/u);
    });
  });
});
