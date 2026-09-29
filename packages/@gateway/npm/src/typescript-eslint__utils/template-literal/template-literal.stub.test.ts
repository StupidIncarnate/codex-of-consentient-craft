import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TemplateLiteralStub } from './template-literal.stub';

describe('TemplateLiteralStub', () => {
  it('VALID: {} => a real TemplateLiteral parsed from the default code', () => {
    const node = TemplateLiteralStub();

    expect({ type: node.type, text: 'const t = `a`;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TemplateLiteral,
      text: '`a`',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TemplateLiteralStub({ code: '  const t = `a`;' });

    expect(node.range).toStrictEqual([
      TemplateLiteralStub().range[0] + 2,
      TemplateLiteralStub().range[1] + 2,
    ]);
  });
});
