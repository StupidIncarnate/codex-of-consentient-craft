import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { pastedImageDownscaleBroker } from './pasted-image-downscale-broker';
import { pastedImageDownscaleBrokerProxy } from './pasted-image-downscale-broker.proxy';
import { AttachmentIdStub } from '../../../contracts/attachment-id/attachment-id.stub';
import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';

describe('pastedImageDownscaleBroker', () => {
  describe('caps the longest edge on the first re-encode', () => {
    it('VALID: {widthPx: 6000, heightPx: 4000, over the byte ceiling} => the png re-encode lands the longest edge exactly on maxLongestEdgePx (#check-downscale-caps-longest-edge)', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });
      proxy.reencodeYields({ dataUrl: 'data:image/png;base64,AAAA' });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const attachmentId = AttachmentIdStub();
      const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      const result = await pastedImageDownscaleBroker({ attachmentId, dataUrl, mediaType });

      expect(result).toStrictEqual({
        attachmentId,
        mediaType,
        dataUrl: 'data:image/png;base64,AAAA',
        byteLength: 3,
        widthPx: pastedImageStatics.maxLongestEdgePx,
        heightPx: 1333,
      });

      expect(proxy.getRescaleCalls().map(({ size }) => size)).toStrictEqual([
        { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
      ]);
    });
  });

  describe('lands under the byte ceiling', () => {
    it('VALID: {widthPx: 6000, heightPx: 4000, over the byte ceiling} => the resulting attachment decodes at or under maxBytesPerImage (#check-downscale-lands-under-cap)', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });
      proxy.reencodeYields({ dataUrl: 'data:image/png;base64,AAAA' });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      const result = await pastedImageDownscaleBroker({
        attachmentId: AttachmentIdStub(),
        dataUrl,
        mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
      });

      expect(result.byteLength).toBeLessThanOrEqual(pastedImageStatics.maxBytesPerImage);
    });
  });

  describe('already under the ceiling', () => {
    it('EDGE: {dataUrl already at or under maxBytesPerImage} => returns the attachment unchanged with no rescale attempt', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 800, heightPx: 600 });

      const attachmentId = AttachmentIdStub();
      const mediaType = PastedImageMediaTypeStub({ value: 'image/png' });
      const dataUrl = ImageDataUrlStub({ value: 'data:image/png;base64,AAAA' });

      const result = await pastedImageDownscaleBroker({ attachmentId, dataUrl, mediaType });

      expect(result).toStrictEqual({
        attachmentId,
        mediaType,
        dataUrl,
        byteLength: 3,
        widthPx: 800,
        heightPx: 600,
      });

      expect(proxy.getRescaleCalls()).toStrictEqual([]);
    });
  });

  describe('png still over the ceiling', () => {
    it('VALID: {png re-encode at maxLongestEdgePx still over the ceiling} => retries at the same size as image/jpeg at jpegQuality', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const oversizedPngOutput = ImageDataUrlStub({
        value: `data:image/png;base64,${overCeilingBase64}`,
      });
      const smallJpegOutput = ImageDataUrlStub({ value: 'data:image/jpeg;base64,AAAA' });

      proxy.reencodeYieldsInOrder({ dataUrls: [oversizedPngOutput, smallJpegOutput] });

      const attachmentId = AttachmentIdStub();
      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      const result = await pastedImageDownscaleBroker({
        attachmentId,
        dataUrl,
        mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
      });

      expect(result).toStrictEqual({
        attachmentId,
        mediaType: 'image/jpeg',
        dataUrl: smallJpegOutput,
        byteLength: 3,
        widthPx: pastedImageStatics.maxLongestEdgePx,
        heightPx: 1333,
      });

      expect(proxy.getRescaleCalls()).toStrictEqual([
        {
          size: { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
          mediaType: 'image/png',
          quality: 1,
        },
        {
          size: { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
          mediaType: 'image/jpeg',
          quality: pastedImageStatics.jpegQuality,
        },
      ]);
    });
  });

  describe('jpeg still over the ceiling', () => {
    it('VALID: {jpeg re-encode at maxLongestEdgePx still over the ceiling} => halves the longest edge and retries as jpeg', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const oversizedPngOutput = ImageDataUrlStub({
        value: `data:image/png;base64,${overCeilingBase64}`,
      });
      const oversizedJpegAtCap = ImageDataUrlStub({
        value: `data:image/jpeg;base64,${overCeilingBase64}`,
      });
      const smallJpegAtHalf = ImageDataUrlStub({ value: 'data:image/jpeg;base64,AAAA' });

      proxy.reencodeYieldsInOrder({
        dataUrls: [oversizedPngOutput, oversizedJpegAtCap, smallJpegAtHalf],
      });

      const attachmentId = AttachmentIdStub();
      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      const result = await pastedImageDownscaleBroker({
        attachmentId,
        dataUrl,
        mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
      });

      const halvedLongestEdgePx = pastedImageStatics.maxLongestEdgePx / 2;

      expect(result).toStrictEqual({
        attachmentId,
        mediaType: 'image/jpeg',
        dataUrl: smallJpegAtHalf,
        byteLength: 3,
        widthPx: halvedLongestEdgePx,
        heightPx: 667,
      });

      expect(proxy.getRescaleCalls()).toStrictEqual([
        {
          size: { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
          mediaType: 'image/png',
          quality: 1,
        },
        {
          size: { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
          mediaType: 'image/jpeg',
          quality: pastedImageStatics.jpegQuality,
        },
        {
          size: { widthPx: halvedLongestEdgePx, heightPx: 667 },
          mediaType: 'image/jpeg',
          quality: pastedImageStatics.jpegQuality,
        },
      ]);
    });
  });

  describe('bottoms out at the floor', () => {
    it('ERROR: {still over the ceiling at minLongestEdgePx} => rejects and never requests below the floor', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const overPng = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });
      const overJpegAtCap = ImageDataUrlStub({
        value: `data:image/jpeg;base64,${overCeilingBase64}`,
      });
      const overJpegAtHalf = ImageDataUrlStub({
        value: `data:image/jpeg;base64,${overCeilingBase64}`,
      });
      const overJpegAtFloor = ImageDataUrlStub({
        value: `data:image/jpeg;base64,${overCeilingBase64}`,
      });

      proxy.reencodeYieldsInOrder({
        dataUrls: [overPng, overJpegAtCap, overJpegAtHalf, overJpegAtFloor],
      });

      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      await expect(
        pastedImageDownscaleBroker({
          attachmentId: AttachmentIdStub(),
          dataUrl,
          mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
        }),
      ).rejects.toThrow(/pastedImageDownscaleBroker/u);

      expect(proxy.getRescaleCalls().map(({ size }) => size)).toStrictEqual([
        { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
        { widthPx: pastedImageStatics.maxLongestEdgePx, heightPx: 1333 },
        { widthPx: pastedImageStatics.maxLongestEdgePx / 2, heightPx: 667 },
        { widthPx: pastedImageStatics.minLongestEdgePx, heightPx: 341 },
      ]);
    });
  });

  describe('decode failure', () => {
    it('ERROR: {measure adapter rejects} => propagates the decode failure', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.decodeFails({ error: new Error('truncated clipboard image') });

      await expect(
        pastedImageDownscaleBroker({
          attachmentId: AttachmentIdStub(),
          dataUrl: ImageDataUrlStub(),
          mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
        }),
      ).rejects.toThrow(/truncated clipboard image/u);
    });
  });

  describe('re-encoded media type', () => {
    it('EDGE: {input mediaType: image/png, ladder had to re-encode} => the returned attachment carries image/jpeg', async () => {
      const proxy = pastedImageDownscaleBrokerProxy();
      proxy.originalIs({ widthPx: 6000, heightPx: 4000 });

      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );
      const oversizedPngOutput = ImageDataUrlStub({
        value: `data:image/png;base64,${overCeilingBase64}`,
      });
      const smallJpegOutput = ImageDataUrlStub({ value: 'data:image/jpeg;base64,AAAA' });

      proxy.reencodeYieldsInOrder({ dataUrls: [oversizedPngOutput, smallJpegOutput] });

      const dataUrl = ImageDataUrlStub({ value: `data:image/png;base64,${overCeilingBase64}` });

      const result = await pastedImageDownscaleBroker({
        attachmentId: AttachmentIdStub(),
        dataUrl,
        mediaType: PastedImageMediaTypeStub({ value: 'image/png' }),
      });

      expect(result.mediaType).toBe('image/jpeg');
    });
  });
});
