import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ExportDefaultDeclarationStub } from './export-default-declaration.stub';

describe('ExportDefaultDeclarationStub', () => {
  it('VALID: {} => a real ExportDefaultDeclaration parsed from the default code', () => {
    const node = ExportDefaultDeclarationStub();

    expect({ type: node.type, text: 'export default a;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ExportDefaultDeclaration,
      text: 'export default a;',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ExportDefaultDeclarationStub({ code: '  export default a;' });

    expect(node.range).toStrictEqual([
      ExportDefaultDeclarationStub().range[0] + 2,
      ExportDefaultDeclarationStub().range[1] + 2,
    ]);
  });
});
