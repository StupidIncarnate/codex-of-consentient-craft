import { domComposerWriteAdapter } from './dom-composer-write-adapter';
import { domComposerWriteAdapterProxy } from './dom-composer-write-adapter.proxy';
import { AttachmentIdStub } from '../../../contracts/attachment-id/attachment-id.stub';
import { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';
import { ComposerSegmentStub } from '../../../contracts/composer-segment/composer-segment.stub';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

describe('domComposerWriteAdapter', () => {
  describe('mixed text and image segments', () => {
    it('VALID: {segments: text, image, text} => editor childNodes are exactly [Text, IMG, Text] in order', () => {
      domComposerWriteAdapterProxy();
      const attachmentId = AttachmentIdStub();
      const attachment = ComposerAttachmentStub({
        attachmentId,
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      });
      const editor = document.createElement('div');

      const result = domComposerWriteAdapter({
        editor,
        segments: [
          ComposerSegmentStub({ kind: 'text', text: 'before ' }),
          ComposerSegmentStub({ kind: 'image', attachmentId }),
          ComposerSegmentStub({ kind: 'text', text: ' after' }),
        ],
        attachments: new Map([[attachmentId, attachment]]),
      });

      const thumbnail = editor.querySelector('img')!;

      expect({
        adapterResult: result,
        nodeNames: Array.from(editor.childNodes, (node) => node.nodeName),
        thumbnailSrc: thumbnail.getAttribute('src'),
        thumbnailAttachmentId: thumbnail.getAttribute(chatComposerStatics.thumbnail.attributeName),
      }).toStrictEqual({
        adapterResult: { success: true },
        nodeNames: ['#text', 'IMG', '#text'],
        thumbnailSrc: 'data:image/png;base64,iVBORw0KGgo=',
        thumbnailAttachmentId: attachmentId,
      });
    });
  });

  describe('thumbnail markup', () => {
    it('VALID: {segments: image} => the thumbnail carries contenteditable="false" and the static testId', () => {
      domComposerWriteAdapterProxy();
      const attachmentId = AttachmentIdStub();
      const attachment = ComposerAttachmentStub({ attachmentId });
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'image', attachmentId })],
        attachments: new Map([[attachmentId, attachment]]),
      });

      const thumbnail = editor.querySelector('img')!;

      expect({
        contentEditable: thumbnail.getAttribute('contenteditable'),
        testId: thumbnail.getAttribute('data-testid'),
      }).toStrictEqual({
        contentEditable: 'false',
        testId: chatComposerStatics.thumbnail.testId,
      });
    });

    it("VALID: {segments: image, attachment widthPx/heightPx: 6000/4000} => the restored thumbnail carries a bounded max-height/max-width with object-fit: contain, regardless of the attachment's own pixel dimensions (#check-restored-thumbnail-render-size-bounded)", () => {
      domComposerWriteAdapterProxy();
      const attachmentId = AttachmentIdStub();
      const attachment = ComposerAttachmentStub({ attachmentId, widthPx: 6000, heightPx: 4000 });
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'image', attachmentId })],
        attachments: new Map([[attachmentId, attachment]]),
      });

      const thumbnail = editor.querySelector('img')!;

      expect({
        maxHeight: thumbnail.style.maxHeight,
        maxWidth: thumbnail.style.maxWidth,
        objectFit: thumbnail.style.objectFit,
      }).toStrictEqual({
        maxHeight: `${String(chatComposerStatics.thumbnail.maxHeightPx)}px`,
        maxWidth: `${String(chatComposerStatics.thumbnail.maxWidthPx)}px`,
        objectFit: 'contain',
      });
    });
  });

  describe('missing attachment', () => {
    it('EDGE: {segments: image whose id is missing from attachments} => renders nothing for that segment', () => {
      domComposerWriteAdapterProxy();
      const missingAttachmentId = AttachmentIdStub();
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'image', attachmentId: missingAttachmentId })],
        attachments: new Map(),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual([]);
    });
  });

  describe('non-empty editor', () => {
    it('EDGE: {editor: already has stale children} => replaces rather than appends', () => {
      domComposerWriteAdapterProxy();
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('stale'));

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'text', text: 'fresh' })],
        attachments: new Map(),
      });

      expect(Array.from(editor.childNodes, (node) => node.textContent)).toStrictEqual(['fresh']);
    });
  });

  describe('trailing newline caret filler', () => {
    it('VALID: {segments: [text ending in "\\n"]} => editor childNodes are exactly [Text, marked BR] (#check-restored-trailing-newline-gets-caret-filler)', () => {
      domComposerWriteAdapterProxy();
      const editor = document.createElement('div');

      const result = domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'text', text: 'one\n' })],
        attachments: new Map(),
      });

      expect(result).toStrictEqual({ success: true });

      const snapshot = Array.from(editor.childNodes, (node) => ({
        nodeName: node.nodeName,
        text: node.textContent,
      }));

      expect(snapshot).toStrictEqual([
        { nodeName: '#text', text: 'one\n' },
        { nodeName: 'BR', text: '' },
      ]);

      const fillerMarkers = Array.from(
        editor.querySelectorAll(`br[${chatComposerStatics.caretFiller.attributeName}]`),
      ).map((element) => element.getAttribute(chatComposerStatics.caretFiller.attributeName));

      expect(fillerMarkers).toStrictEqual(['true']);
    });

    it('VALID: {segments: text, image, text ending in "\\n"} => the filler <br> is appended after the LAST written node, not the last segment slot (#check-restored-trailing-newline-filler-after-mixed-content)', () => {
      domComposerWriteAdapterProxy();
      const attachmentId = AttachmentIdStub();
      const attachment = ComposerAttachmentStub({ attachmentId });
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [
          ComposerSegmentStub({ kind: 'text', text: 'A' }),
          ComposerSegmentStub({ kind: 'image', attachmentId }),
          ComposerSegmentStub({ kind: 'text', text: 'B\n' }),
        ],
        attachments: new Map([[attachmentId, attachment]]),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual([
        '#text',
        'IMG',
        '#text',
        'BR',
      ]);
    });

    it('EDGE: {segments: [text NOT ending in "\\n"]} => no filler <br> is appended (#check-non-trailing-newline-gets-no-filler)', () => {
      domComposerWriteAdapterProxy();
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'text', text: 'one' })],
        attachments: new Map(),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual(['#text']);
    });

    it("EDGE: {segments: [text 'ab\\ncd']} => a NON-trailing newline (real content follows it in the same text node) appends no filler <br> (#check-mid-content-newline-gets-no-filler)", () => {
      domComposerWriteAdapterProxy();
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'text', text: 'ab\ncd' })],
        attachments: new Map(),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual(['#text']);
    });

    it('EDGE: {segments: [text ending in "\\n", image whose id is missing from attachments]} => the trailing image segment is skipped, and the filler still lands after the last WRITTEN node (#check-restored-trailing-newline-filler-skips-missing-attachment)', () => {
      domComposerWriteAdapterProxy();
      const missingAttachmentId = AttachmentIdStub();
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [
          ComposerSegmentStub({ kind: 'text', text: 'one\n' }),
          ComposerSegmentStub({ kind: 'image', attachmentId: missingAttachmentId }),
        ],
        attachments: new Map(),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual(['#text', 'BR']);
    });

    it('EDGE: {segments: [image only]} => a trailing image segment (no text at all) appends no filler <br>', () => {
      domComposerWriteAdapterProxy();
      const attachmentId = AttachmentIdStub();
      const attachment = ComposerAttachmentStub({ attachmentId });
      const editor = document.createElement('div');

      domComposerWriteAdapter({
        editor,
        segments: [ComposerSegmentStub({ kind: 'image', attachmentId })],
        attachments: new Map([[attachmentId, attachment]]),
      });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual(['IMG']);
    });

    it('EMPTY: {segments: []} => appends no filler <br> and the editor is left with no children', () => {
      domComposerWriteAdapterProxy();
      const editor = document.createElement('div');

      domComposerWriteAdapter({ editor, segments: [], attachments: new Map() });

      expect(Array.from(editor.childNodes, (node) => node.nodeName)).toStrictEqual([]);
    });
  });
});
