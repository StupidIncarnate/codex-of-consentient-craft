import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';

import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';
import { imageRescaleBroker } from './image-rescale-broker';
import { imageRescaleBrokerProxy } from './image-rescale-broker.proxy';

describe('imageRescaleBroker', () => {
  describe('drawing and encoding', () => {
    it('VALID: {size: 2000x1333, image/png, quality 0.82} => canvasEncode receives exactly that size, media type and quality', async () => {
      const proxy = imageRescaleBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({
        dataUrl: 'data:image/png;base64,AAAA',
        mediaType: 'image/png',
        quality: 0.82,
      });

      await imageRescaleBroker({
        dataUrl,
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(proxy.getEncodeRequests()).toStrictEqual([
        { widthPx: 2000, heightPx: 1333, mediaType: 'image/png', quality: 0.82 },
      ]);
    });

    it('VALID: {encode answers a data url} => returns that exact data url', async () => {
      const proxy = imageRescaleBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({
        dataUrl: 'data:image/png;base64,AAAA',
        mediaType: 'image/png',
        quality: 0.82,
      });

      const result = await imageRescaleBroker({
        dataUrl,
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(result).toBe('data:image/png;base64,AAAA');
    });
  });

  describe('bitmap lifecycle', () => {
    it('EDGE: {successful encode} => closes the decoded bitmap', async () => {
      const proxy = imageRescaleBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({
        dataUrl: 'data:image/png;base64,AAAA',
        mediaType: 'image/png',
        quality: 0.82,
      });

      await imageRescaleBroker({
        dataUrl,
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(proxy.getClosedBitmapSizes()).toStrictEqual([{ widthPx: 6000, heightPx: 4000 }]);
    });
  });

  describe('context unavailable', () => {
    it('ERROR: {2d context unavailable} => rejects with the encode failure and still closes the bitmap', async () => {
      const proxy = imageRescaleBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });
      proxy.contextUnavailable();

      await expect(
        imageRescaleBroker({
          dataUrl,
          size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
          mediaType: PastedImageMediaTypeStub(),
          quality: 0.82,
        }),
      ).rejects.toThrow(/2d canvas context unavailable/u);
      expect(proxy.getClosedBitmapSizes()).toStrictEqual([{ widthPx: 6000, heightPx: 4000 }]);
    });
  });

  describe('decode failure', () => {
    it('ERROR: {decode rejects} => propagates the rejection', async () => {
      const proxy = imageRescaleBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodeFails({ dataUrl, error: new Error('EncodingError: truncated image') });

      await expect(
        imageRescaleBroker({
          dataUrl,
          size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
          mediaType: PastedImageMediaTypeStub(),
          quality: 0.82,
        }),
      ).rejects.toThrow(/EncodingError/u);
    });
  });
});
