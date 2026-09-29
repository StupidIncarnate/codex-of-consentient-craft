import { HTMLImageElement } from './HTMLImageElement';
import { HtmlImageElementStub } from './html-image-element.stub';

describe('HtmlImageElementStub', () => {
  it('VALID: {given fields} => a real HTMLImageElement carrying them', () => {
    const image = HtmlImageElementStub({ src: 'data:image/png;base64,BBBB' });

    expect({ isImage: image instanceof HTMLImageElement, src: image.src }).toStrictEqual({
      isImage: true,
      src: 'data:image/png;base64,BBBB',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const image = HtmlImageElementStub();

    expect(image.src).toBe('data:image/png;base64,AAAA');
  });
});
