import { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';
import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';

import { draftImagesSaveBroker } from './draft-images-save-broker';
import { draftImagesSaveBrokerProxy } from './draft-images-save-broker.proxy';

describe('draftImagesSaveBroker', () => {
  describe('quest observables', () => {
    it('VALID: {attachments: [one pasted image]} => the IndexedDB draft store holds one record whose bytes equal the pasted image bytes (#check-draft-bytes-in-indexeddb)', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      const payload = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
      const attachment = ComposerAttachmentStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        dataUrl: `data:image/png;base64,${payload}`,
      });

      await draftImagesSaveBroker({ attachments: [attachment] });

      const stored = proxy.getStoredDrafts();

      expect(stored).toStrictEqual([
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataBase64: payload,
        },
      ]);
      expect(stored.at(0)?.dataBase64).toBe(payload);
    });

    it('VALID: {attachments: [A, B, C]} => a draft holding 3 tokens has exactly 3 IndexedDB records, one per attachmentId, in order (#check-draft-record-count-matches-tokens)', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      const attachmentA = ComposerAttachmentStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        dataUrl: 'data:image/png;base64,QUFBQQ==',
      });
      const attachmentB = ComposerAttachmentStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        dataUrl: 'data:image/png;base64,QkJCQg==',
      });
      const attachmentC = ComposerAttachmentStub({
        attachmentId: '33333333-3333-4333-8333-333333333333',
        dataUrl: 'data:image/png;base64,Q0NDQw==',
      });

      await draftImagesSaveBroker({ attachments: [attachmentA, attachmentB, attachmentC] });

      expect(proxy.getStoredDrafts()).toStrictEqual([
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataBase64: 'QUFBQQ==',
        },
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataBase64: 'QkJCQg==',
        },
        {
          attachmentId: '33333333-3333-4333-8333-333333333333',
          mediaType: 'image/png',
          dataBase64: 'Q0NDQw==',
        },
      ]);
    });

    it('VALID: {store already holds A, save carries []} => after backspacing a thumbnail away, the IndexedDB draft store holds zero records for that attachmentId (#check-deleted-attachment-leaves-draft)', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      proxy.storeAlreadyHolds({
        drafts: [
          PastedImageDraftStub({
            attachmentId: '11111111-1111-4111-8111-111111111111',
            dataBase64: 'QUFBQQ==',
          }),
        ],
      });

      await draftImagesSaveBroker({ attachments: [] });

      expect(proxy.getStoredDrafts()).toStrictEqual([]);
    });

    it('VALID: {store already holds A and B, save carries only B} => deleting the first of two thumbnails leaves exactly one IndexedDB draft record, the one belonging to the surviving thumbnail (#check-remaining-attachment-kept)', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      proxy.storeAlreadyHolds({
        drafts: [
          PastedImageDraftStub({
            attachmentId: '11111111-1111-4111-8111-111111111111',
            dataBase64: 'QUFBQQ==',
          }),
          PastedImageDraftStub({
            attachmentId: '22222222-2222-4222-8222-222222222222',
            dataBase64: 'QkJCQg==',
          }),
        ],
      });
      const attachmentB = ComposerAttachmentStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        dataUrl: 'data:image/png;base64,QkJCQg==',
      });

      await draftImagesSaveBroker({ attachments: [attachmentB] });

      expect(proxy.getStoredDrafts()).toStrictEqual([
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataBase64: 'QkJCQg==',
        },
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {attachments: []} against an already-empty store => leaves it empty and resolves via the adapter', async () => {
      const proxy = draftImagesSaveBrokerProxy();

      const result = await draftImagesSaveBroker({ attachments: [] });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStoredDrafts()).toStrictEqual([]);
    });

    it('EMPTY: {attachments: []} with the store unavailable => still rejects, proving the broker calls the adapter rather than short-circuiting on an empty list', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      proxy.storeUnavailable({ error: new Error('blocked') });

      await expect(draftImagesSaveBroker({ attachments: [] })).rejects.toThrow(
        /draftImagesSaveBroker/u,
      );
    });
  });

  describe('error handling', () => {
    it('ERROR: {store fails to open} => rejects with a message naming this broker', async () => {
      const proxy = draftImagesSaveBrokerProxy();
      proxy.storeUnavailable({ error: new Error('blocked') });
      const attachment = ComposerAttachmentStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        dataUrl: 'data:image/png;base64,QUFBQQ==',
      });

      await expect(draftImagesSaveBroker({ attachments: [attachment] })).rejects.toThrow(
        /draftImagesSaveBroker/u,
      );
    });
  });

  describe('media type', () => {
    it("EDGE: {attachment dataUrl media type: image/jpeg} => the stored record carries the attachment's OWN mediaType, not a default", async () => {
      const proxy = draftImagesSaveBrokerProxy();
      const attachment = ComposerAttachmentStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/jpeg',
        dataUrl: 'data:image/jpeg;base64,QUFBQQ==',
      });

      await draftImagesSaveBroker({ attachments: [attachment] });

      expect(proxy.getStoredDrafts().at(0)?.mediaType).toBe('image/jpeg');
    });
  });
});
