import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { ExportSpecifierStub } from './export-specifier.stub';

describe('ExportSpecifierStub', () => {
  it('VALID: {} => a real ExportSpecifier parsed from the default code', () => {
    const node = ExportSpecifierStub();

    expect({ type: node.type, text: 'export { a };'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.ExportSpecifier,
      text: 'a',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = ExportSpecifierStub({ code: '  export { a };' });

    expect(node.range).toStrictEqual([
      ExportSpecifierStub().range[0] + 2,
      ExportSpecifierStub().range[1] + 2,
    ]);
  });
});
