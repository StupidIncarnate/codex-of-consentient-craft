import { JSXFragmentStub } from './jsx-fragment.stub';

describe('JSXFragmentStub', () => {
  it('VALID: {} => a real JSXFragment with a text child, inside a VariableDeclarator', () => {
    const node = JSXFragmentStub();

    expect({
      type: node.type,
      hasChildren: node.children.length > 0,
      parentType: node.parent.type,
    }).toStrictEqual({
      type: 'JSXFragment',
      hasChildren: true,
      parentType: 'VariableDeclarator',
    });
  });
});
