import { VariableDeclarationStub } from './variable-declaration.stub';

describe('VariableDeclarationStub', () => {
  it('VALID: {} => a real "const" VariableDeclaration with one declarator', () => {
    const node = VariableDeclarationStub();

    expect({ kind: node.kind, declarationCount: node.declarations.length }).toStrictEqual({
      kind: 'const',
      declarationCount: 1,
    });
  });

  it('VALID: {code: "let" with two declarators} => real kind and declarations reflect the code', () => {
    const node = VariableDeclarationStub({ code: 'let a = 1, b = 2;' });

    expect({ kind: node.kind, declarationCount: node.declarations.length }).toStrictEqual({
      kind: 'let',
      declarationCount: 2,
    });
  });
});
