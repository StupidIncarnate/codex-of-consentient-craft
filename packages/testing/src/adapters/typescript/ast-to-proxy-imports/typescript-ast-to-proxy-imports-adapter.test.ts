import * as ts from 'typescript';
import { typescriptAstToProxyImportsAdapter } from './typescript-ast-to-proxy-imports-adapter';
import { typescriptAstToProxyImportsAdapterProxy } from './typescript-ast-to-proxy-imports-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';

describe('typescriptAstToProxyImportsAdapter', () => {
  describe('valid proxy imports', () => {
    it('VALID: {sourceFile with named .proxy import} => returns import edge with its names', () => {
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

      expect(result).toStrictEqual([
        { kind: 'import', importPath: './test.proxy', names: ['adapterProxy'] },
      ]);
    });

    it('VALID: {multiple proxy imports} => returns one edge per import, each with its own names', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
import { proxy1 } from './proxy1.proxy';
import { proxy2 } from '../proxy2.proxy';
import { something } from './regular';
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect([...result].sort((a, b) => a.importPath.localeCompare(b.importPath))).toStrictEqual([
        { kind: 'import', importPath: '../proxy2.proxy', names: ['proxy2'] },
        { kind: 'import', importPath: './proxy1.proxy', names: ['proxy1'] },
      ]);
    });

    it('VALID: {renamed named import} => returns edge naming the ORIGINAL export, not the local alias', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `import { adapterProxy as renamed } from './test.proxy';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { kind: 'import', importPath: './test.proxy', names: ['adapterProxy'] },
      ]);
    });

    it('VALID: {namespace import} => returns import edge with names: null', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `import * as testingBarrel from '@dungeonmaster/shared/testing';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { kind: 'import', importPath: '@dungeonmaster/shared/testing', names: null },
      ]);
    });

    it('VALID: {proxy import with .ts extension} => returns import edge', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `import { adapterProxy } from './test.proxy.ts';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { kind: 'import', importPath: './test.proxy.ts', names: ['adapterProxy'] },
      ]);
    });
  });

  describe('valid proxy exports', () => {
    it('VALID: {sourceFile with export * from .proxy} => returns reexport edge with names: null', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
export * from './adapters.proxy';

export const foo = 'bar';
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { kind: 'reexport', importPath: './adapters.proxy', names: null },
      ]);
    });

    it('VALID: {sourceFile with named export from .proxy} => returns reexport edge with its names', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `export { adapterProxy } from './test.proxy';`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect(result).toStrictEqual([
        { kind: 'reexport', importPath: './test.proxy', names: ['adapterProxy'] },
      ]);
    });

    it('VALID: {mixed imports and exports} => returns one edge per declaration, kind and names intact', () => {
      typescriptAstToProxyImportsAdapterProxy();

      const code = `
import { brokerProxy } from './broker.proxy';
export * from './adapter.proxy';
import { regular } from './regular';
export { other } from './other.proxy';
`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const result = typescriptAstToProxyImportsAdapter({ sourceFile });

      expect([...result].sort((a, b) => a.importPath.localeCompare(b.importPath))).toStrictEqual([
        { kind: 'reexport', importPath: './adapter.proxy', names: null },
        { kind: 'import', importPath: './broker.proxy', names: ['brokerProxy'] },
        { kind: 'reexport', importPath: './other.proxy', names: ['other'] },
      ]);
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
