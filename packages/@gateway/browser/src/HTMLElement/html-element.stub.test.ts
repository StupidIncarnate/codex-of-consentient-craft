import { HTMLElement } from './HTMLElement';
import { HtmlElementStub } from './html-element.stub';

describe('HtmlElementStub', () => {
  it('VALID: {given fields} => a real HTMLElement carrying them', () => {
    const element = HtmlElementStub({ tagName: 'section' });

    expect({ isHtmlElement: element instanceof HTMLElement, tag: element.tagName }).toStrictEqual({
      isHtmlElement: true,
      tag: 'SECTION',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const element = HtmlElementStub();

    expect(element.tagName).toBe('DIV');
  });
});
