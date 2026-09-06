import { domComposerDeleteThumbnailAdapter } from './dom-composer-delete-thumbnail-adapter';
import { domComposerDeleteThumbnailAdapterProxy } from './dom-composer-delete-thumbnail-adapter.proxy';
import { AttachmentIdStub } from '../../../contracts/attachment-id/attachment-id.stub';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

describe('domComposerDeleteThumbnailAdapter', () => {
  it('VALID: {editor holds a lone thumbnail, caret directly after it, direction: backward} => a single Backspace removes that whole thumbnail element and returns its id (#check-one-backspace-removes-thumbnail)', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    editor.appendChild(thumbnail);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 1);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(attachmentId);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([]);
  });

  it('VALID: {composer content "a" + thumbnail + "b", caret directly after the thumbnail, direction: backward} => removing the thumbnail leaves the composer reading "ab" as a single merged text node (#check-surrounding-text-survives)', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const textA = document.createTextNode('a');
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    const textB = document.createTextNode('b');
    editor.appendChild(textA);
    editor.appendChild(thumbnail);
    editor.appendChild(textB);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(attachmentId);
    expect(editor.textContent).toBe('ab');

    // Two adjacent text nodes would also read "ab" via textContent alone — the array length is
    // what proves they were actually merged into one node, not left as siblings.
    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'ab' }]);
  });

  it('VALID: {editor holds a lone thumbnail, caret directly before it, direction: forward} => removes that whole thumbnail element and returns its id', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    editor.appendChild(thumbnail);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'forward' });

    expect(result).toBe(attachmentId);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([]);
  });

  it('EDGE: {editor holds thumbnail + text "b", caret at offset 0 of "b", direction: backward} => removes the preceding thumbnail', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    const textB = document.createTextNode('b');
    editor.appendChild(thumbnail);
    editor.appendChild(textB);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(textB, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(attachmentId);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'b' }]);
  });

  it('EDGE: {editor holds text "a" + thumbnail, caret at the end of "a", direction: forward} => removes the following thumbnail', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const textA = document.createTextNode('a');
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    editor.appendChild(textA);
    editor.appendChild(thumbnail);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(textA, textA.length);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'forward' });

    expect(result).toBe(attachmentId);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'a' }]);
  });

  it('EDGE: {caret in the middle of plain text, direction: backward} => returns undefined and the editor is unchanged', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const text = document.createTextNode('hello world');
    editor.appendChild(text);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(undefined);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'hello world' }]);
  });

  it('EDGE: {caret in the middle of plain text, direction: forward} => returns undefined and the editor is unchanged', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const text = document.createTextNode('hello world');
    editor.appendChild(text);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'forward' });

    expect(result).toBe(undefined);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'hello world' }]);
  });

  // Playwright's `.fill()` on CHAT_INPUT select-alls the field then runs a single native delete
  // over that selection — a non-collapsed selection spanning a thumbnail is exactly that shape,
  // and this adapter must decline it so `.fill()` keeps working across the 18 e2e specs that use
  // it on CHAT_INPUT.
  it('EDGE: {non-collapsed selection spans a thumbnail} => returns undefined and the editor is unchanged', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const textA = document.createTextNode('a');
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    const textB = document.createTextNode('b');
    editor.appendChild(textA);
    editor.appendChild(thumbnail);
    editor.appendChild(textB);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(textA, 0);
    range.setEnd(textB, 1);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(undefined);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'a' },
      { nodeName: 'IMG', text: '' },
      { nodeName: '#text', text: 'b' },
    ]);
  });

  it('EMPTY: {no selection at all} => returns undefined and the editor is unchanged', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const attachmentId = AttachmentIdStub();
    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
    editor.appendChild(thumbnail);
    const selection = document.getSelection();
    selection?.removeAllRanges();

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(undefined);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: 'IMG', text: '' }]);
  });

  it('EDGE: {editor holds an <img> without the thumbnail attribute, caret directly after it, direction: backward} => returns undefined and the image is not removed', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const plainImage = document.createElement('img');
    plainImage.setAttribute('src', 'https://example.test/plain.png');
    editor.appendChild(plainImage);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 1);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(undefined);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: 'IMG', text: '' }]);
    expect(plainImage.getAttribute('src')).toBe('https://example.test/plain.png');
  });

  it('EDGE: {editor holds two thumbnails back to back, caret after the second, direction: backward} => only the second thumbnail is removed and the first keeps its src', () => {
    domComposerDeleteThumbnailAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const firstAttachmentId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
    const secondAttachmentId = AttachmentIdStub({ value: 'a1b2c3d4-5678-4abc-9def-0123456789ab' });
    const firstThumbnail = document.createElement('img');
    firstThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, firstAttachmentId);
    firstThumbnail.setAttribute('src', 'data:image/png;base64,AAA=');
    const secondThumbnail = document.createElement('img');
    secondThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, secondAttachmentId);
    secondThumbnail.setAttribute('src', 'data:image/png;base64,BBB=');
    editor.appendChild(firstThumbnail);
    editor.appendChild(secondThumbnail);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });

    expect(result).toBe(secondAttachmentId);

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: 'IMG', text: '' }]);

    const srcs = Array.from(editor.querySelectorAll('img')).map((img) => img.getAttribute('src'));

    expect(srcs).toStrictEqual(['data:image/png;base64,AAA=']);
  });
});
