import { Element } from './Element';
import { ElementStub } from './element.stub';

describe('ElementStub', () => {
  it('VALID: {given fields} => a real Element carrying them', () => {
    const element = ElementStub({ tagName: 'span' });

    expect({ isElement: element instanceof Element, tag: element.tagName }).toStrictEqual({
      isElement: true,
      tag: 'SPAN',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const element = ElementStub();

    expect(element.tagName).toBe('DIV');
  });
});
