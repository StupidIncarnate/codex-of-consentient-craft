import { PastedImageMediaTypeStub } from '@dungeonmaster/shared/contracts';

import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { ImageSizeStub } from '../../../contracts/image-size/image-size.stub';
import { canvasImageRescaleAdapter } from './canvas-image-rescale-adapter';
import { canvasImageRescaleAdapterProxy } from './canvas-image-rescale-adapter.proxy';

describe('canvasImageRescaleAdapter', () => {
  describe('drawing', () => {
    it('VALID: {size: 2000x1333} => drawImage receives exactly that width and height', async () => {
      const proxy = canvasImageRescaleAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({ dataUrl: 'data:image/png;base64,AAAA' });

      await canvasImageRescaleAdapter({
        dataUrl: ImageDataUrlStub(),
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(proxy.getDrawnSize()).toStrictEqual({ widthPx: 2000, heightPx: 1333 });
    });
  });

  describe('encoding', () => {
    it('VALID: {mediaType: image/png, quality: 0.82} => toDataURL receives exactly those arguments', async () => {
      const proxy = canvasImageRescaleAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({ dataUrl: 'data:image/png;base64,AAAA' });

      await canvasImageRescaleAdapter({
        dataUrl: ImageDataUrlStub(),
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(proxy.getEncodeArguments()).toStrictEqual(['image/png', 0.82]);
    });

    it('VALID: {toDataURL resolves a data url} => returns that exact data url', async () => {
      const proxy = canvasImageRescaleAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });
      proxy.encodesTo({ dataUrl: 'data:image/png;base64,AAAA' });

      const result = await canvasImageRescaleAdapter({
        dataUrl: ImageDataUrlStub(),
        size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
        mediaType: PastedImageMediaTypeStub(),
        quality: 0.82,
      });

      expect(result).toBe('data:image/png;base64,AAAA');
    });
  });

  describe('context unavailable', () => {
    it('ERROR: {2d context unavailable} => throws naming canvasImageRescaleAdapter', async () => {
      const proxy = canvasImageRescaleAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });
      proxy.contextUnavailable();

      await expect(
        canvasImageRescaleAdapter({
          dataUrl: ImageDataUrlStub(),
          size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
          mediaType: PastedImageMediaTypeStub(),
          quality: 0.82,
        }),
      ).rejects.toThrow(/canvasImageRescaleAdapter/u);
    });
  });

  describe('decode failure', () => {
    it('ERROR: {decode rejects} => propagates the rejection', async () => {
      const proxy = canvasImageRescaleAdapterProxy();
      proxy.decodeFails({ error: new Error('EncodingError: truncated image') });

      await expect(
        canvasImageRescaleAdapter({
          dataUrl: ImageDataUrlStub(),
          size: ImageSizeStub({ widthPx: 2000, heightPx: 1333 }),
          mediaType: PastedImageMediaTypeStub(),
          quality: 0.82,
        }),
      ).rejects.toThrow(/EncodingError/u);
    });
  });
});
