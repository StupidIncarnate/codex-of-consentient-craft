import * as ts from 'typescript';
import { typescriptAstToModuleMockCallsAdapter } from './typescript-ast-to-module-mock-calls-adapter';
import { typescriptAstToModuleMockCallsAdapterProxy } from './typescript-ast-to-module-mock-calls-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';

describe('typescriptAstToModuleMockCallsAdapter', () => {
  it('VALID: {registerModuleMock with module and factory} => returns mock call', () => {
    typescriptAstToModuleMockCallsAdapterProxy();

    const code = `registerModuleMock({ module: 'eslint-plugin-jest', factory: () => ({ default: { rules: {} } }) });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = typescriptAstToModuleMockCallsAdapter({ sourceFile });

    expect(result).toStrictEqual([
      {
        moduleName: 'eslint-plugin-jest',
        factory: `() => ({ default: { rules: {} } })`,
        sourceFile: 'test.proxy.ts',
      },
    ]);
  });

  it('VALID: {registerModuleMock without factory} => returns mock call with null factory', () => {
    typescriptAstToModuleMockCallsAdapterProxy();

    const code = `registerModuleMock({ module: 'some-module' });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = typescriptAstToModuleMockCallsAdapter({ sourceFile });

    expect(result).toStrictEqual([
      {
        moduleName: 'some-module',
        factory: null,
        sourceFile: 'test.proxy.ts',
      },
    ]);
  });

  it('VALID: {no registerModuleMock calls} => returns empty array', () => {
    typescriptAstToModuleMockCallsAdapterProxy();

    const code = `registerMock({ fn: existsSync });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = typescriptAstToModuleMockCallsAdapter({ sourceFile });

    expect(result).toStrictEqual([]);
  });
});
