import * as ts from 'typescript';
import { typescriptAstToProxyImportsAdapter } from './typescript-ast-to-proxy-imports-adapter';
import { typescriptAstToProxyImportsAdapterProxy } from './typescript-ast-to-proxy-imports-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';

describe('typescriptAstToProxyImportsAdapter', () => {
  describe('valid proxy imports', () => {
    it('VALID: {sourceFile with .proxy import} => returns proxy import path', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
import { adapterProxy } from './test.proxy';

describe('test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual(['./test.proxy']);
    });

    it('VALID: {multiple proxy imports} => returns all proxy import paths', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
import { proxy1 } from './proxy1.proxy';
import { proxy2 } from '../proxy2.proxy';
import { something } from './regular';

describe('test', () => {});
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual(['../proxy2.proxy', './proxy1.proxy']);
    });

    it('VALID: {proxy import with .ts extension} => returns proxy import', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `import { adapterProxy } from './test.proxy.ts';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual(['./test.proxy.ts']);
    });
  });

  describe('no proxy imports', () => {
    it('EMPTY: {sourceFile with no proxy imports} => returns empty array', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
import { something } from './regular';
import { another } from '../adapter';

describe('test', () => {});
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {sourceFile with no imports} => returns empty array', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `describe('test', () => {});`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([]);
    });
  });
});
