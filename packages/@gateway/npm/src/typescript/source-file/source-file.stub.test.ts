import * as ts from 'typescript';
import { SourceFileStub } from './source-file.stub';

describe('SourceFileStub', () => {
  it('VALID: {} => a real ts.SourceFile with the default name and text', () => {
    const sourceFile = SourceFileStub();

    expect({
      fileName: sourceFile.fileName,
      text: sourceFile.text,
      statementCount: sourceFile.statements.length,
      firstStatementKind: sourceFile.statements[0]?.kind,
    }).toStrictEqual({
      fileName: 'gateway-stub-sample.ts',
      text: 'const a = 1;',
      statementCount: 1,
      firstStatementKind: ts.SyntaxKind.VariableStatement,
    });
  });

  it('VALID: {code, fileName} => real statements and name reflect the given overrides', () => {
    const sourceFile = SourceFileStub({ code: 'function foo() {}', fileName: 'other.ts' });

    expect({
      fileName: sourceFile.fileName,
      firstStatementKind: sourceFile.statements[0]?.kind,
    }).toStrictEqual({
      fileName: 'other.ts',
      firstStatementKind: ts.SyntaxKind.FunctionDeclaration,
    });
  });
});
