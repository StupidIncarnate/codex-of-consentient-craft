import * as ts from '#gateway/npm/typescript';
import { astModuleMockCallsTransformer } from './ast-module-mock-calls-transformer';
import { TypescriptSourceFileStub } from '../../contracts/typescript-source-file/typescript-source-file.stub';

describe('astModuleMockCallsTransformer', () => {
  it('VALID: {registerModuleMock with module and factory} => returns mock call', () => {
    const code = `registerModuleMock({ module: 'eslint-plugin-jest', factory: () => ({ default: { rules: {} } }) });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = astModuleMockCallsTransformer({ sourceFile });

    expect(result).toStrictEqual([
      {
        moduleName: 'eslint-plugin-jest',
        factory: `() => ({ default: { rules: {} } })`,
        sourceFile: 'test.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      },
    ]);
  });

  it('VALID: {registerModuleMock without factory} => returns mock call with null factory', () => {
    const code = `registerModuleMock({ module: 'some-module' });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = astModuleMockCallsTransformer({ sourceFile });

    expect(result).toStrictEqual([
      {
        moduleName: 'some-module',
        factory: null,
        sourceFile: 'test.proxy.ts',
        identifierNames: [],
        objectIdentifierNames: [],
      },
    ]);
  });

  it('VALID: {no registerModuleMock calls} => returns empty array', () => {
    const code = `registerMock({ fn: existsSync });`;
    const tsSourceFile = ts.createSourceFile('test.proxy.ts', code, ts.ScriptTarget.Latest, true);
    const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

    const result = astModuleMockCallsTransformer({ sourceFile });

    expect(result).toStrictEqual([]);
  });
});
