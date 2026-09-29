import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { TemplateElementStub } from './template-element.stub';

describe('TemplateElementStub', () => {
  it('VALID: {} => a real TemplateElement parsed from the default code', () => {
    const node = TemplateElementStub();

    expect({ type: node.type, text: 'const t = `a`;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.TemplateElement,
      text: '`a`',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = TemplateElementStub({ code: '  const t = `a`;' });

    expect(node.range).toStrictEqual([
      TemplateElementStub().range[0] + 2,
      TemplateElementStub().range[1] + 2,
    ]);
  });
});
