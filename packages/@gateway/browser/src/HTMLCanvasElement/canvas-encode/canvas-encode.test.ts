import { ImageBitmapStub } from '../../createImageBitmap/image-bitmap.stub';
import { canvasEncode } from './canvas-encode';
import { canvasEncodeProxy } from './canvas-encode.proxy';

describe('canvasEncode', () => {
  it('VALID: {a staged encode} => returns the staged data URL', () => {
    const proxy = canvasEncodeProxy();
    proxy.stageEncode({
      mediaType: 'image/jpeg',
      quality: 0.82,
      dataUrl: 'data:image/jpeg;base64,AAAA',
    });

    const result = canvasEncode({
      image: ImageBitmapStub(),
      widthPx: 200,
      heightPx: 100,
      mediaType: 'image/jpeg',
      quality: 0.82,
    });

    expect(result).toBe('data:image/jpeg;base64,AAAA');
  });

  it('VALID: {two media types staged} => each encode returns the output staged for its own type', () => {
    const proxy = canvasEncodeProxy();
    proxy.stageEncode({ mediaType: 'image/png', quality: 1, dataUrl: 'data:image/png;base64,PNG' });
    proxy.stageEncode({
      mediaType: 'image/jpeg',
      quality: 0.5,
      dataUrl: 'data:image/jpeg;base64,JPG',
    });

    const result = canvasEncode({
      image: ImageBitmapStub(),
      widthPx: 4,
      heightPx: 4,
      mediaType: 'image/png',
      quality: 1,
    });

    expect(result).toBe('data:image/png;base64,PNG');
  });

  it('ERROR: {no 2d context available} => throws naming the missing context', () => {
    const proxy = canvasEncodeProxy();
    proxy.stageEncode({ mediaType: 'image/png', quality: 1, dataUrl: 'data:image/png;base64,PNG' });
    proxy.stageContextUnavailable();

    expect(() =>
      canvasEncode({
        image: ImageBitmapStub(),
        widthPx: 4,
        heightPx: 4,
        mediaType: 'image/png',
        quality: 1,
      }),
    ).toThrow(/^canvasEncode: 2d canvas context unavailable$/u);
  });

  describe('one-shot staging', () => {
    it('VALID: {two one-shot encodes staged for one media type and quality} => each ask gets its own answer, in order', () => {
      const proxy = canvasEncodeProxy();
      proxy.stageEncodeOnce({
        mediaType: 'image/jpeg',
        quality: 0.82,
        dataUrl: 'data:image/jpeg;base64,FIRST',
      });
      proxy.stageEncodeOnce({
        mediaType: 'image/jpeg',
        quality: 0.82,
        dataUrl: 'data:image/jpeg;base64,SECOND',
      });
      const ask = (): string =>
        canvasEncode({
          image: ImageBitmapStub(),
          widthPx: 8,
          heightPx: 8,
          mediaType: 'image/jpeg',
          quality: 0.82,
        });

      expect([ask(), ask()]).toStrictEqual([
        'data:image/jpeg;base64,FIRST',
        'data:image/jpeg;base64,SECOND',
      ]);
    });

    it('ERROR: {one-shot context unavailable staged} => the next encode throws naming the missing context', () => {
      const proxy = canvasEncodeProxy();
      proxy.stageContextUnavailableOnce();

      expect(() =>
        canvasEncode({
          image: ImageBitmapStub(),
          widthPx: 4,
          heightPx: 4,
          mediaType: 'image/png',
          quality: 1,
        }),
      ).toThrow(/^canvasEncode: 2d canvas context unavailable$/u);
    });
  });

  describe('call inspection', () => {
    it('VALID: {an encode already made} => getDrawCalls reads back the bitmap and the size it was drawn at', () => {
      const proxy = canvasEncodeProxy();
      proxy.stageEncode({
        mediaType: 'image/png',
        quality: 1,
        dataUrl: 'data:image/png;base64,PNG',
      });
      const image = ImageBitmapStub({ width: 3000, height: 2000 });

      canvasEncode({ image, widthPx: 1500, heightPx: 1000, mediaType: 'image/png', quality: 1 });

      expect(proxy.getDrawCalls()).toStrictEqual([
        { image, dx: 0, dy: 0, dWidth: 1500, dHeight: 1000 },
      ]);
    });

    it('VALID: {an encode already made} => getEncodeRequests reads back the requested type and quality', () => {
      const proxy = canvasEncodeProxy();
      proxy.stageEncode({
        mediaType: 'image/jpeg',
        quality: 0.82,
        dataUrl: 'data:image/jpeg;base64,AAAA',
      });

      canvasEncode({
        image: ImageBitmapStub(),
        widthPx: 8,
        heightPx: 8,
        mediaType: 'image/jpeg',
        quality: 0.82,
      });

      expect(proxy.getEncodeRequests()).toStrictEqual([{ mediaType: 'image/jpeg', quality: 0.82 }]);
    });
  });
});
