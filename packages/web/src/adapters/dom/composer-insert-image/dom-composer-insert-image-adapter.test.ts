import { domComposerInsertImageAdapter } from './dom-composer-insert-image-adapter';
import { domComposerInsertImageAdapterProxy } from './dom-composer-insert-image-adapter.proxy';
import { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

describe('domComposerInsertImageAdapter', () => {
  it('VALID: {caret between "before" and "after" text nodes} => child order becomes text "before", thumbnail, text "after" (#check-thumbnail-lands-at-caret)', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const before = document.createTextNode('before');
    const after = document.createTextNode('after');
    editor.appendChild(before);
    editor.appendChild(after);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 1);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'before' },
      { nodeName: 'IMG', text: '' },
      { nodeName: '#text', text: 'after' },
    ]);
  });

  it('VALID: {caret between "ab" and "cd" inside one word} => child order is text "ab", thumbnail, text "cd", with neither half lost (#check-paste-mid-word-splits-cleanly)', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const word = document.createTextNode('abcd');
    editor.appendChild(word);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(word, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'ab' },
      { nodeName: 'IMG', text: '' },
      { nodeName: '#text', text: 'cd' },
    ]);
  });

  it('VALID: {two pastes into an empty composer with no keystroke between them} => two sibling thumbnails and zero text nodes between them (#check-two-adjacent-thumbnails-no-text)', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachmentOne = ComposerAttachmentStub({
      attachmentId: '11111111-1111-4111-a111-111111111111',
      dataUrl: 'data:image/png;base64,AAA=',
    });
    const attachmentTwo = ComposerAttachmentStub({
      attachmentId: '22222222-2222-4222-a222-222222222222',
      dataUrl: 'data:image/png;base64,BBB=',
    });

    domComposerInsertImageAdapter({ editor, attachment: attachmentOne });
    const result = domComposerInsertImageAdapter({ editor, attachment: attachmentTwo });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: 'IMG', text: '' },
      { nodeName: 'IMG', text: '' },
    ]);

    const attachmentIds = Array.from(editor.querySelectorAll('img')).map((img) =>
      img.getAttribute(chatComposerStatics.thumbnail.attributeName),
    );

    expect(attachmentIds).toStrictEqual([attachmentOne.attachmentId, attachmentTwo.attachmentId]);
  });

  it('VALID: {editor holding "a " with the caret at its end} => the text node still reads exactly "a " with its trailing space, and the thumbnail follows it (#check-space-before-thumbnail-survives)', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const spaced = document.createTextNode('a ');
    editor.appendChild(spaced);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(spaced, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'a ' },
      { nodeName: 'IMG', text: '' },
    ]);
  });

  it('VALID: {inserted thumbnail} => contains zero button descendants (#check-thumbnail-has-no-remove-control)', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    domComposerInsertImageAdapter({ editor, attachment });

    expect(Array.from(editor.querySelectorAll('button'))).toStrictEqual([]);
  });

  it('VALID: {inserted thumbnail} => carries contenteditable="false", the thumbnail attribute set to the attachmentId, and the attachment dataUrl as src', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    domComposerInsertImageAdapter({ editor, attachment });

    const thumbnail = editor.querySelector('img');

    expect(thumbnail?.getAttribute('contenteditable')).toBe('false');
    expect(thumbnail?.getAttribute(chatComposerStatics.thumbnail.attributeName)).toBe(
      attachment.attachmentId,
    );
    expect(thumbnail?.getAttribute('data-testid')).toBe(chatComposerStatics.thumbnail.testId);
    expect(thumbnail?.getAttribute('src')).toBe(attachment.dataUrl);
  });

  it("VALID: {inserted thumbnail} => carries a bounded max-height/max-width with object-fit: contain, regardless of the attachment's own pixel dimensions (#check-thumbnail-render-size-bounded)", () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub({ widthPx: 6000, heightPx: 4000 });
    domComposerInsertImageAdapter({ editor, attachment });

    const thumbnail = editor.querySelector('img');

    expect(thumbnail?.style.maxHeight).toBe(`${chatComposerStatics.thumbnail.maxHeightPx}px`);
    expect(thumbnail?.style.maxWidth).toBe(`${chatComposerStatics.thumbnail.maxWidthPx}px`);
    expect(thumbnail?.style.objectFit).toBe('contain');
  });

  it('VALID: {image inserted, then a text node inserted at the resulting live caret} => the text lands after the thumbnail, not before', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    const liveRange = selection?.getRangeAt(0);
    const textNode = document.createTextNode('next');
    liveRange?.insertNode(textNode);

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: 'IMG', text: '' },
      { nodeName: '#text', text: 'next' },
    ]);
  });

  it('EDGE: {no live range} => thumbnail is appended at the end of the composer', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const abc = document.createTextNode('abc');
    editor.appendChild(abc);
    const selection = document.getSelection();
    selection?.removeAllRanges();

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'abc' },
      { nodeName: 'IMG', text: '' },
    ]);
  });

  it('EDGE: {live range sits in a different element} => thumbnail is appended at the end of the composer', () => {
    domComposerInsertImageAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const abc = document.createTextNode('abc');
    editor.appendChild(abc);

    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);
    const elsewhereText = document.createTextNode('somewhere else');
    elsewhere.appendChild(elsewhereText);

    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(elsewhereText, 3);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const attachment = ComposerAttachmentStub();
    const result = domComposerInsertImageAdapter({ editor, attachment });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'abc' },
      { nodeName: 'IMG', text: '' },
    ]);
  });
});
