import { composerCaretFillerElementTransformer } from './composer-caret-filler-element-transformer';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

describe('composerCaretFillerElementTransformer', () => {
  it('VALID: {ownerDocument: document} => returns an empty <br> carrying the marker attribute set to "true"', () => {
    const caretFiller = composerCaretFillerElementTransformer({ ownerDocument: document });

    expect({
      tagName: caretFiller.tagName,
      attributeValue: caretFiller.getAttribute(chatComposerStatics.caretFiller.attributeName),
      textContent: caretFiller.textContent,
    }).toStrictEqual({
      tagName: 'BR',
      attributeValue: 'true',
      textContent: '',
    });
  });

  it('VALID: {two separate calls} => each call returns a DIFFERENT element instance', () => {
    const first = composerCaretFillerElementTransformer({ ownerDocument: document });
    const second = composerCaretFillerElementTransformer({ ownerDocument: document });
    first.setAttribute('data-marker', 'first-only');

    expect(second.getAttribute('data-marker')).toBe(null);
  });
});
