import { ImageDataUrlStub } from '../../../contracts/image-data-url/image-data-url.stub';
import { imageMeasureBroker } from './image-measure-broker';
import { imageMeasureBrokerProxy } from './image-measure-broker.proxy';

describe('imageMeasureBroker', () => {
  describe('successful decode', () => {
    it('VALID: {bitmap: 6000x4000} => returns { widthPx: 6000, heightPx: 4000 }', async () => {
      const proxy = imageMeasureBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });

      const result = await imageMeasureBroker({ dataUrl });

      expect(result).toStrictEqual({ widthPx: 6000, heightPx: 4000 });
    });

    it('VALID: {bitmap: 2000x2000} => returns a square size unchanged', async () => {
      const proxy = imageMeasureBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 2000, heightPx: 2000 });

      const result = await imageMeasureBroker({ dataUrl });

      expect(result).toStrictEqual({ widthPx: 2000, heightPx: 2000 });
    });

    it('VALID: {two data urls of different byte lengths} => each is measured from its own decode', async () => {
      const proxy = imageMeasureBrokerProxy();
      const eightBytes = ImageDataUrlStub({ value: 'data:image/png;base64,iVBORw0KGgo=' });
      const fourBytes = ImageDataUrlStub({ value: 'data:image/png;base64,QUFBQQ==' });
      proxy.decodesTo({ dataUrl: eightBytes, widthPx: 800, heightPx: 600 });
      proxy.decodesTo({ dataUrl: fourBytes, widthPx: 40, heightPx: 30 });

      const results = [
        await imageMeasureBroker({ dataUrl: fourBytes }),
        await imageMeasureBroker({ dataUrl: eightBytes }),
      ];

      expect(results).toStrictEqual([
        { widthPx: 40, heightPx: 30 },
        { widthPx: 800, heightPx: 600 },
      ]);
    });
  });

  describe('decode failure', () => {
    it('ERROR: {decode rejects} => propagates the rejection', async () => {
      const proxy = imageMeasureBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodeFails({ dataUrl, error: new Error('EncodingError: truncated image') });

      await expect(imageMeasureBroker({ dataUrl })).rejects.toThrow(/EncodingError/u);
    });
  });

  describe('bitmap lifecycle', () => {
    it('EDGE: {successful decode} => closes the bitmap after reading its dimensions', async () => {
      const proxy = imageMeasureBrokerProxy();
      const dataUrl = ImageDataUrlStub();
      proxy.decodesTo({ dataUrl, widthPx: 6000, heightPx: 4000 });

      await imageMeasureBroker({ dataUrl });

      expect(proxy.getClosedBitmapSizes()).toStrictEqual([{ widthPx: 6000, heightPx: 4000 }]);
    });
  });
});
