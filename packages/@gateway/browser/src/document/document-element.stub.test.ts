import { DocumentElementStub } from './document-element.stub';

describe('DocumentElementStub', () => {
  it('VALID: {} => a real HTMLDivElement owned by the real document', () => {
    const element = DocumentElementStub();

    expect({
      isElement: element instanceof HTMLElement,
      tagName: element.tagName,
      ownerDocument: element.ownerDocument === globalThis.document,
    }).toStrictEqual({ isElement: true, tagName: 'DIV', ownerDocument: true });
  });

  it('VALID: {tagName: "span"} => a real element with that tag', () => {
    const element = DocumentElementStub({ tagName: 'span' });

    expect(element.tagName).toBe('SPAN');
  });
});
