import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { canvasImageMeasureAdapter } from './canvas-image-measure-adapter';
import { canvasImageMeasureAdapterProxy } from './canvas-image-measure-adapter.proxy';

describe('canvasImageMeasureAdapter', () => {
  describe('successful decode', () => {
    it('VALID: {bitmap: 6000x4000} => returns { widthPx: 6000, heightPx: 4000 }', async () => {
      const proxy = canvasImageMeasureAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });

      const result = await canvasImageMeasureAdapter({ dataUrl: ImageDataUrlStub() });

      expect(result).toStrictEqual({ widthPx: 6000, heightPx: 4000 });
    });

    it('VALID: {bitmap: 2000x2000} => returns a square size unchanged', async () => {
      const proxy = canvasImageMeasureAdapterProxy();
      proxy.decodesTo({ widthPx: 2000, heightPx: 2000 });

      const result = await canvasImageMeasureAdapter({ dataUrl: ImageDataUrlStub() });

      expect(result).toStrictEqual({ widthPx: 2000, heightPx: 2000 });
    });
  });

  describe('decode failure', () => {
    it('ERROR: {decode rejects} => propagates the rejection', async () => {
      const proxy = canvasImageMeasureAdapterProxy();
      proxy.decodeFails({ error: new Error('EncodingError: truncated image') });

      await expect(canvasImageMeasureAdapter({ dataUrl: ImageDataUrlStub() })).rejects.toThrow(
        /EncodingError/u,
      );
    });
  });

  describe('bitmap lifecycle', () => {
    it('EDGE: {successful decode} => closes the bitmap after reading its dimensions', async () => {
      const proxy = canvasImageMeasureAdapterProxy();
      proxy.decodesTo({ widthPx: 6000, heightPx: 4000 });

      await canvasImageMeasureAdapter({ dataUrl: ImageDataUrlStub() });

      expect(proxy.wasBitmapClosed()).toBe(true);
    });
  });
});
