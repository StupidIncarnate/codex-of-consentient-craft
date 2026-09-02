import { domComposerInsertTextAdapter } from './dom-composer-insert-text-adapter';
import { domComposerInsertTextAdapterProxy } from './dom-composer-insert-text-adapter.proxy';

describe('domComposerInsertTextAdapter', () => {
  it('VALID: {empty composer, caret at start} => pasting "hello" leaves it reading exactly "hello" with zero thumbnails (#check-text-paste-into-empty-composer)', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerInsertTextAdapter({ editor, text: 'hello' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([{ nodeName: '#text', text: 'hello' }]);
  });

  it('VALID: {caret at the end of "abc" text node} => pasting "def" leaves the composer reading "abcdef" (#check-text-paste-appends-after-text)', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const abc = document.createTextNode('abc');
    editor.appendChild(abc);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(abc, 3);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerInsertTextAdapter({ editor, text: 'def' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'abc' },
      { nodeName: '#text', text: 'def' },
    ]);
    expect(editor.textContent).toBe('abcdef');
  });

  it('VALID: {caret between "ab" and "cd" inside one text node} => pasting "XY" leaves the composer reading "abXYcd" (#check-text-paste-splits-existing-text)', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const abcd = document.createTextNode('abcd');
    editor.appendChild(abcd);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(abcd, 2);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerInsertTextAdapter({ editor, text: 'XY' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'ab' },
      { nodeName: '#text', text: 'XY' },
      { nodeName: '#text', text: 'cd' },
    ]);
    expect(editor.textContent).toBe('abXYcd');
  });

  it('VALID: {caret between two thumbnails} => pasting "mid" leaves child order thumbnail 1, text "mid", thumbnail 2, and both thumbnails keep their srcs (#check-text-paste-between-two-thumbnails)', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const thumbnailOne = document.createElement('img');
    thumbnailOne.setAttribute('src', 'data:image/png;base64,AAA=');
    const thumbnailTwo = document.createElement('img');
    thumbnailTwo.setAttribute('src', 'data:image/png;base64,BBB=');
    editor.appendChild(thumbnailOne);
    editor.appendChild(thumbnailTwo);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 1);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const result = domComposerInsertTextAdapter({ editor, text: 'mid' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: 'IMG', text: '' },
      { nodeName: '#text', text: 'mid' },
      { nodeName: 'IMG', text: '' },
    ]);

    const srcs = Array.from(editor.querySelectorAll('img')).map((img) => img.getAttribute('src'));

    expect(srcs).toStrictEqual(['data:image/png;base64,AAA=', 'data:image/png;base64,BBB=']);
  });

  it('EDGE: {no live range} => text is appended at the end of the composer', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const abc = document.createTextNode('abc');
    editor.appendChild(abc);
    const selection = document.getSelection();
    selection?.removeAllRanges();

    const result = domComposerInsertTextAdapter({ editor, text: 'def' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'abc' },
      { nodeName: '#text', text: 'def' },
    ]);
  });

  it('EDGE: {live range sits in a different element} => text is appended at the end of the composer', () => {
    domComposerInsertTextAdapterProxy();

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

    const result = domComposerInsertTextAdapter({ editor, text: 'def' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'abc' },
      { nodeName: '#text', text: 'def' },
    ]);
  });

  it('VALID: {two inserts into an empty composer with no caret reset between them} => the selection stays collapsed after each insertion so the second insert lands after the first', () => {
    domComposerInsertTextAdapterProxy();

    const editor = document.createElement('div');
    document.body.appendChild(editor);
    const selection = document.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    domComposerInsertTextAdapter({ editor, text: 'ab' });
    const result = domComposerInsertTextAdapter({ editor, text: 'cd' });

    expect(result).toStrictEqual({ success: true });

    const snapshot = Array.from(editor.childNodes).map((node) => ({
      nodeName: node.nodeName,
      text: node.textContent,
    }));

    expect(snapshot).toStrictEqual([
      { nodeName: '#text', text: 'ab' },
      { nodeName: '#text', text: 'cd' },
    ]);
    expect(editor.textContent).toBe('abcd');
  });
});
