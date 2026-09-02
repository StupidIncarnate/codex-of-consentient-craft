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

  describe('a corrupt row does not block the rest', () => {
    it('EDGE: {store holds [bad, good], bad draft fails to measure} => the bad row is skipped and the good one still loads', async () => {
      const proxy = draftImagesLoadBrokerProxy();
      const bad = PastedImageDraftStub({
        attachmentId: '11111111-1111-4111-8111-111111111111',
        mediaType: 'image/png',
        dataBase64: 'iVBORw0KGgo=',
      });
      const good = PastedImageDraftStub({
        attachmentId: '22222222-2222-4222-8222-222222222222',
        mediaType: 'image/png',
        dataBase64: 'QUFBQQ==',
      });
      proxy.storeHolds({ drafts: [bad, good] });
      proxy.measureFails({ dataUrl: ImageDataUrlStub(), error: new Error('decode failed') });
      proxy.measures({ dataUrl: ImageDataUrlStub(), widthPx: 400, heightPx: 300 });

      const result = await draftImagesLoadBroker();

      expect(result).toStrictEqual([
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
