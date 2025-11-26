import * as ts from 'typescript';
import { typescriptAstToMockCallsAdapter } from './typescript-ast-to-mock-calls-adapter';
import { typescriptAstToMockCallsAdapterProxy } from './typescript-ast-to-mock-calls-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';

describe('typescriptAstToMockCallsAdapter', () => {
  describe('valid jest.mock calls', () => {
    it('VALID: {sourceFile with jest.mock} => returns mock call', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `jest.mock('fs');`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        moduleName: 'fs',
        factory: null,
        sourceFile: 'test.proxy.ts',
      });
    });

    it('VALID: {jest.mock with factory} => returns mock call with factory', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `jest.mock('axios', () => ({ get: jest.fn() }));`;
      const tsSourceFile = ts.createSourceFile(
        'adapter.proxy.ts',
        code,
        ts.ScriptTarget.Latest,
        true,
      );
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toHaveLength(1);
      expect(result[0]?.moduleName).toBe('axios');
      expect(result[0]?.factory).toMatch(/get.*jest\.fn/u);
      expect(result[0]?.sourceFile).toBe('adapter.proxy.ts');
    });

    it('VALID: {multiple jest.mock calls} => returns all mock calls', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
jest.mock('fs');
jest.mock('path');
jest.mock('axios', () => ({}));
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toHaveLength(3);
      expect(result[0]?.moduleName).toBe('axios');
      expect(result[1]?.moduleName).toBe('path');
      expect(result[2]?.moduleName).toBe('fs');
    });
  });

  describe('no mock calls', () => {
    it('EMPTY: {sourceFile without jest.mock} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = `
export const adapterProxy = () => {
  return {};
};
`;
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty file} => returns empty array', () => {
      typescriptAstToMockCallsAdapterProxy();

      const code = '';
      const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToMockCallsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });
});
