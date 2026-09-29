import { document } from '#gateway/browser/document';
import { composerReadTransformer } from './composer-read-transformer';
import { AttachmentIdStub } from '../../contracts/attachment-id/attachment-id.stub';
import { ComposerSegmentStub } from '../../contracts/composer-segment/composer-segment.stub';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

describe('composerReadTransformer', () => {
  describe('empty editor', () => {
    it('EMPTY: {editor: no children} => returns an empty segment list', () => {
      const editor = document.createElement('div');

      expect(composerReadTransformer({ editor })).toStrictEqual([]);
    });
  });

  describe('text-only content', () => {
    it('VALID: {editor: one text node "hello"} => returns one text segment', () => {
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('hello'));

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: 'hello' }),
      ]);
    });
  });

  describe('mixed text and thumbnail content', () => {
    it('VALID: {editor: text, thumbnail, text} => returns three segments in order', () => {
      const attachmentId = AttachmentIdStub();
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('before '));
      const thumbnail = document.createElement('img');
      thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachmentId);
      editor.appendChild(thumbnail);
      editor.appendChild(document.createTextNode(' after'));

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: 'before ' }),
        ComposerSegmentStub({ kind: 'image', attachmentId }),
        ComposerSegmentStub({ kind: 'text', text: ' after' }),
      ]);
    });
  });

  describe('adjacent thumbnails', () => {
    it('VALID: {editor: two adjacent thumbnails} => returns two image segments with no text segment between', () => {
      const firstAttachmentId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondAttachmentId = AttachmentIdStub({
        value: 'a1b2c3d4-5e6f-4a2b-9c3d-1234567890ab',
      });
      const editor = document.createElement('div');
      const firstThumbnail = document.createElement('img');
      firstThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, firstAttachmentId);
      const secondThumbnail = document.createElement('img');
      secondThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, secondAttachmentId);
      editor.appendChild(firstThumbnail);
      editor.appendChild(secondThumbnail);

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'image', attachmentId: firstAttachmentId }),
        ComposerSegmentStub({ kind: 'image', attachmentId: secondAttachmentId }),
      ]);
    });
  });

  describe('adjacent text node merge — the round-trip invariant', () => {
    it('VALID: {editor: adjacent text nodes "ab" and "cd"} => merges into one text segment "abcd"', () => {
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('ab'));
      editor.appendChild(document.createTextNode('cd'));

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: 'abcd' }),
      ]);
    });
  });

  describe('empty text node between thumbnails', () => {
    it('EDGE: {editor: thumbnail, empty text node, thumbnail} => the empty text node contributes nothing', () => {
      const firstAttachmentId = AttachmentIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const secondAttachmentId = AttachmentIdStub({
        value: 'a1b2c3d4-5e6f-4a2b-9c3d-1234567890ab',
      });
      const editor = document.createElement('div');
      const firstThumbnail = document.createElement('img');
      firstThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, firstAttachmentId);
      const secondThumbnail = document.createElement('img');
      secondThumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, secondAttachmentId);
      editor.appendChild(firstThumbnail);
      editor.appendChild(document.createTextNode(''));
      editor.appendChild(secondThumbnail);

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'image', attachmentId: firstAttachmentId }),
        ComposerSegmentStub({ kind: 'image', attachmentId: secondAttachmentId }),
      ]);
    });
  });

  describe('whitespace preservation', () => {
    it('EDGE: {editor: text node "  padded  "} => leading and trailing spaces survive exactly', () => {
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('  padded  '));

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: '  padded  ' }),
      ]);
    });
  });

  describe('line break element', () => {
    it('EDGE: {editor: a <br> element} => becomes a newline text segment', () => {
      const editor = document.createElement('div');
      editor.appendChild(document.createElement('br'));

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: '\n' }),
      ]);
    });
  });

  describe('caret filler line break', () => {
    it('EDGE: {editor: text "one", a real newline, and a marked filler <br>} => the filler contributes nothing, so the segment list ends at the real newline', () => {
      const editor = document.createElement('div');
      editor.appendChild(document.createTextNode('one'));
      editor.appendChild(document.createTextNode('\n'));
      const filler = document.createElement('br');
      filler.setAttribute(chatComposerStatics.caretFiller.attributeName, 'true');
      editor.appendChild(filler);

      expect(composerReadTransformer({ editor })).toStrictEqual([
        ComposerSegmentStub({ kind: 'text', text: 'one\n' }),
      ]);
    });
  });
});
