import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';

import { pastedImageAttachBroker } from './pasted-image-attach-broker';
import { pastedImageAttachBrokerProxy } from './pasted-image-attach-broker.proxy';
import { ComposerAttachmentStub } from '../../../contracts/composer-attachment/composer-attachment.stub';
import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';

describe('pastedImageAttachBroker', () => {
  describe('successful attach', () => {
    it('VALID: {dataUrl, mediaType, under the byte ceiling} => returns the attachment the downscale ladder produced, carrying the minted id', async () => {
      const proxy = pastedImageAttachBrokerProxy();
      const mintedId = '00000000-0000-4000-8000-000000000001';
      proxy.mintsIds({ ids: [mintedId] });

      const dataUrl = ImageDataUrlStub({ value: 'data:image/png;base64,AAAA' });
      const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
      proxy.ladderYields({
        attachment: ComposerAttachmentStub({
          attachmentId: mintedId,
          mediaType,
          dataUrl,
          byteLength: 3,
          widthPx: 800,
          heightPx: 600,
        }),
      });

      const result = await pastedImageAttachBroker({ dataUrl, mediaType });

      expect(result).toStrictEqual({
        attachmentId: mintedId,
        mediaType,
        dataUrl,
        byteLength: 3,
        widthPx: 800,
        heightPx: 600,
      });
    });
  });

  describe('id threaded through to the ladder', () => {
    it('EDGE: {minted id} => the id handed to the downscale ladder is the same one that comes back on the attachment', async () => {
      const proxy = pastedImageAttachBrokerProxy();
      const mintedId = '00000000-0000-4000-8000-000000000002';
      proxy.mintsIds({ ids: [mintedId] });

      const dataUrl = ImageDataUrlStub({ value: 'data:image/png;base64,AAAA' });
      const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
      proxy.ladderYields({
        attachment: ComposerAttachmentStub({
          mediaType,
          dataUrl,
          byteLength: 3,
          widthPx: 800,
          heightPx: 600,
        }),
      });

      const result = await pastedImageAttachBroker({ dataUrl, mediaType });

      expect(result.attachmentId).toBe(mintedId);
    });
  });

  describe('minting a fresh id per paste', () => {
    it('VALID: {two pastes of byte-identical clipboard bytes} => produces attachments with different attachmentIds and identical dataUrl, never collapsed by content hash', async () => {
      const proxy = pastedImageAttachBrokerProxy();
      const firstId = '00000000-0000-4000-8000-000000000003';
      const secondId = '00000000-0000-4000-8000-000000000004';
      proxy.mintsIds({ ids: [firstId, secondId] });

      const dataUrl = ImageDataUrlStub({ value: 'data:image/png;base64,AAAA' });
      const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
      proxy.ladderYields({
        attachment: ComposerAttachmentStub({
          mediaType,
          dataUrl,
          byteLength: 3,
          widthPx: 800,
          heightPx: 600,
        }),
      });

      const first = await pastedImageAttachBroker({ dataUrl, mediaType });
      const second = await pastedImageAttachBroker({ dataUrl, mediaType });

      // Full-object equality on EACH call is what makes the dataUrl comparison explicit: both
      // expected shapes below carry the SAME `dataUrl` field, so a broker that let content hashing
      // leak into either the id or the bytes fails one of these two checks.
      expect(first).toStrictEqual({
        attachmentId: firstId,
        mediaType,
        dataUrl,
        byteLength: 3,
        widthPx: 800,
        heightPx: 600,
      });
      expect(second).toStrictEqual({
        attachmentId: secondId,
        mediaType,
        dataUrl,
        byteLength: 3,
        widthPx: 800,
        heightPx: 600,
      });
    });
  });

  describe('ladder failure', () => {
    it('ERROR: {downscale ladder rejects} => propagates its own message and returns no attachment', async () => {
      const proxy = pastedImageAttachBrokerProxy();
      proxy.mintsIds({ ids: ['00000000-0000-4000-8000-000000000005'] });
      proxy.ladderFails({ error: new Error('truncated clipboard image') });

      await expect(
        pastedImageAttachBroker({
          dataUrl: ImageDataUrlStub(),
          mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
        }),
      ).rejects.toThrow(/truncated clipboard image/u);
    });
  });
});
