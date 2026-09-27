import { JSXElementStub } from './jsx-element.stub';

describe('JSXElementStub', () => {
  it('VALID: {} => a real, parented JSXElement matching the default sample text', () => {
    const node = JSXElementStub();
    const [start, end] = node.range;

    expect({
      openingElementNameType: node.openingElement.name.type,
      elementText: 'const el = <div>hi</div>;'.slice(start, end),
      hasChildren: node.children.length > 0,
    }).toStrictEqual({
      openingElementNameType: 'JSXIdentifier',
      elementText: '<div>hi</div>',
      hasChildren: true,
    });
  });

  it('VALID: {code: a different tag} => real element text reflects the given code', () => {
    const code = 'const el = <span>hi</span>;';
    const node = JSXElementStub({ code });
    const [start, end] = node.range;

    expect(code.slice(start, end)).toBe('<span>hi</span>');
  });
});
