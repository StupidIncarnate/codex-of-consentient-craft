import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { JSXTextStub } from './jsx-text.stub';

describe('JSXTextStub', () => {
  it('VALID: {} => a real JSXText parsed from the default code', () => {
    const node = JSXTextStub();

    expect({ type: node.type, text: 'const j = <a>t</a>;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.JSXText,
      text: 't',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = JSXTextStub({ code: '  const j = <a>t</a>;' });

    expect(node.range).toStrictEqual([JSXTextStub().range[0] + 2, JSXTextStub().range[1] + 2]);
  });
});
