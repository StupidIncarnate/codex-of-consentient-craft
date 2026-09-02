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
});
