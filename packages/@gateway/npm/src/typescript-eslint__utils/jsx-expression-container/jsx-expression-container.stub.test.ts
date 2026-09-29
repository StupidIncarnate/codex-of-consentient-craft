import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { JSXExpressionContainerStub } from './jsx-expression-container.stub';

describe('JSXExpressionContainerStub', () => {
  it('VALID: {} => a real JSXExpressionContainer parsed from the default code', () => {
    const node = JSXExpressionContainerStub();

    expect({ type: node.type, text: 'const j = <a>{b}</a>;'.slice(...node.range) }).toStrictEqual({
      type: AST_NODE_TYPES.JSXExpressionContainer,
      text: '{b}',
    });
  });

  it('VALID: {code} => the node position follows the given code (two leading spaces shift it by two)', () => {
    const node = JSXExpressionContainerStub({ code: '  const j = <a>{b}</a>;' });

    expect(node.range).toStrictEqual([
      JSXExpressionContainerStub().range[0] + 2,
      JSXExpressionContainerStub().range[1] + 2,
    ]);
  });
});
