import { typescriptSourceFileContract } from './typescript-source-file-contract';
import { TypescriptSourceFileStub } from './typescript-source-file.stub';

describe('typescriptSourceFileContract', () => {
  describe('valid source files', () => {
    it('VALID: {fileName: "test.ts"} => returns TypescriptSourceFile', () => {
      const result = typescriptSourceFileContract.parse({ fileName: 'test.ts' });

      expect(result.fileName).toBe('test.ts');
    });
  });

  describe('TypescriptSourceFileStub', () => {
    it('VALID: {value: {fileName: "test.ts"}} => returns TypescriptSourceFile', () => {
      const result = TypescriptSourceFileStub({ value: { fileName: 'test.ts' } });

      expect(result.fileName).toBe('test.ts');
    });
  });
});
