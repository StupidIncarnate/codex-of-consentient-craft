import { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';
import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { PastedImageDraftStub } from '../../../contracts/pasted-image-draft/pasted-image-draft.stub';
import { draftImagesSaveBroker } from '../save/draft-images-save-broker';

import { draftImagesLoadBroker } from './draft-images-load-broker';
import { draftImagesLoadBrokerProxy } from './draft-images-load-broker.proxy';

describe('draftImagesLoadBroker', () => {
  describe('restoring stored drafts', () => {
    it('VALID: {store holds [first, second]} => returns both attachments in store order, each rebuilt and measured', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const first = PastedImageDraftStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
      const second = PastedImageDraftStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        mediaType: 'image/png',
        dataBase64: 'QUFBQQ==',
      });
      proxy.storeHolds({ drafts: [first, second] });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 800, heightPx: 600 });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 400, heightPx: 300 });

      const result = await draftImagesLoadBroker();

      expect(result).toStrictEqual([
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
          byteLength: 8,
          widthPx: 800,
          heightPx: 600,
        },
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataUrl: 'data:image/png;base64,QUFBQQ==',
          byteLength: 4,
          widthPx: 400,
          heightPx: 300,
        },
      ]);
    });

    it("EDGE: {draft mediaType: image/jpeg} => the returned dataUrl carries the draft's OWN media type", async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const draft = PastedImageDraftStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/jpeg',
        dataBase64: 'iVBORw0KGgo=',
      });
      proxy.storeHolds({ drafts: [draft] });
      proxy.measures({
        dataUrl: ImageDataUrlStub({ value: 'data:image/jpeg;base64,iVBORw0KGgo=' }),
        widthPx: 2000,
        heightPx: 1333,
      });

      const result = await draftImagesLoadBroker();

      expect(result.at(0)?.dataUrl).toBe('data:image/jpeg;base64,iVBORw0KGgo=');
    });
  });

  describe('empty store', () => {
    it('EMPTY: {empty store} => returns []', async () => {
      draftImagesLoadBrokerProxy();

      const result = await draftImagesLoadBroker();

      expect(result).toStrictEqual([]);
    });
  });

  describe('a corrupt row leaves a hole rather than renumbering the rest', () => {
    // Defect 1's core: a record that fails to measure must not shift every record AFTER it down
    // one index. Three drafts with the FAILING one in the MIDDLE is what proves this — a
    // compacting implementation would still put the third draft's attachment at index 1 (right
    // after the first), while a position-preserving one leaves a hole at index 1 and lands the
    // third draft's attachment at its OWN index, 2.
    it('EDGE: {store holds [good1, bad, good2], the middle draft fails to measure} => result is [good1Attachment, undefined, good2Attachment] — the hole stays at its own slot', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const good1 = PastedImageDraftStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
      const bad = PastedImageDraftStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        mediaType: 'image/png',
        dataBase64: 'QUFBQQ==',
      });
      const good2 = PastedImageDraftStub({
        attachmentId: '33333333-3333-4333-8333-333333333333',
        mediaType: 'image/png',
        dataBase64: 'YWJjZA==',
      });
      proxy.storeHolds({ drafts: [good1, bad, good2] });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 800, heightPx: 600 });
      proxy.measureFails({ dataUrl: ImageDataUrlStub(), error: new Error('decode failed') });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 400, heightPx: 300 });

      const result = await draftImagesLoadBroker();

      expect(result).toStrictEqual([
        {
          attachmentId: '11111111-1111-4111-8111-111111111111',
          mediaType: 'image/png',
          dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
          byteLength: 8,
          widthPx: 800,
          heightPx: 600,
        },
        undefined,
        {
          attachmentId: '33333333-3333-4333-8333-333333333333',
          mediaType: 'image/png',
          dataUrl: 'data:image/png;base64,YWJjZA==',
          byteLength: 4,
          widthPx: 400,
          heightPx: 300,
        },
      ]);
    });
  });

  describe('a contract-invalid row leaves a hole rather than renumbering the rest', () => {
    // Defect 2 (the second pass on defect 1): a record that fails pastedImageDraftContract in the
    // READ ADAPTER — not a record that decodes badly — must ALSO leave a hole at its own slot
    // rather than being compacted out before this broker's Promise.allSettled ever sees it. Seeded
    // via storeHoldsRaw so the real read adapter runs its own safeParse against the malformed
    // record; storeHolds's typed PastedImageDraft[] cannot express a contract failure at all. Only
    // ONE measures() is staged — if the broker attempted to measure the contract-invalid slot, the
    // second measurement call would have nothing staged to answer it and the test would throw.
    it('EDGE: {store holds [contract-invalid dataBase64, good]} => result is [undefined, goodAttachment] — the good record keeps its own slot', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const good = PastedImageDraftStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        mediaType: 'image/png',
        dataBase64: 'QUFBQQ==',
      });
      proxy.storeHoldsRaw({
        records: [
          {
            attachmentId: '11111111-1111-4111-8111-111111111111',
            mediaType: 'image/png',
            dataBase64: '***garbage-not-base64***',
          },
          good,
        ],
      });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 400, heightPx: 300 });

      const result = await draftImagesLoadBroker();

      expect(result).toStrictEqual([
        undefined,
        {
          attachmentId: '22222222-2222-4222-8222-222222222222',
          mediaType: 'image/png',
          dataUrl: 'data:image/png;base64,QUFBQQ==',
          byteLength: 4,
          widthPx: 400,
          heightPx: 300,
        },
      ]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {store fails to open} => rejects with a message naming this broker', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      proxy.storeUnavailable({ error: new Error('blocked') });

      await expect(draftImagesLoadBroker()).rejects.toThrow(/draftImagesLoadBroker/u);
    });
  });

  describe('round trip with draftImagesSaveBroker', () => {
    it('VALID: {save [pngAttachment, jpegAttachment], then load} => the loaded array equals the saved array', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const pngAttachment = ComposerAttachmentStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        byteLength: 8,
        widthPx: 800,
        heightPx: 600,
      });
      const jpegAttachment = ComposerAttachmentStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        mediaType: 'image/jpeg',
        dataUrl: 'data:image/jpeg;base64,QUFBQQ==',
        byteLength: 4,
        widthPx: 400,
        heightPx: 300,
      });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 800, heightPx: 600 });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 400, heightPx: 300 });

      await draftImagesSaveBroker({ attachments: [pngAttachment, jpegAttachment] });
      const loaded = await draftImagesLoadBroker();

      expect(loaded).toStrictEqual([pngAttachment, jpegAttachment]);
    });
  });
});
