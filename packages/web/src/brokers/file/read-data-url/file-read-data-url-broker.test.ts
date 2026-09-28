import { fileReadDataUrlBroker } from './file-read-data-url-broker';
import { fileReadDataUrlBrokerProxy } from './file-read-data-url-broker.proxy';

describe('fileReadDataUrlBroker', () => {
  describe('valid inputs', () => {
    it('VALID: {blob: png bytes} => reads back as a data url whose base64 payload round-trips the original bytes', async () => {
      fileReadDataUrlBrokerProxy();
      const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
      const blob = new Blob([bytes], { type: 'image/png' });
      const binary = String.fromCharCode(...bytes);
      const expectedBase64 = globalThis.btoa(binary);

      const result = await fileReadDataUrlBroker({ blob });

      expect(result).toBe(`data:image/png;base64,${expectedBase64}`);
    });

    it('VALID: {blob: jpeg bytes} => carries image/jpeg in the result', async () => {
      fileReadDataUrlBrokerProxy();
      const bytes = new Uint8Array([255, 216, 255, 224]);
      const blob = new Blob([bytes], { type: 'image/jpeg' });
      const binary = String.fromCharCode(...bytes);
      const expectedBase64 = globalThis.btoa(binary);

      const result = await fileReadDataUrlBroker({ blob });

      expect(result).toBe(`data:image/jpeg;base64,${expectedBase64}`);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {blob: zero bytes, type: image/png} => rejects because the contract requires at least one base64 character', async () => {
      fileReadDataUrlBrokerProxy();
      const blob = new Blob([], { type: 'image/png' });

      await expect(fileReadDataUrlBroker({ blob })).rejects.toThrow(/Invalid image data URL/u);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {blob: image/bmp} => rejects because the contract refuses the media type', async () => {
      fileReadDataUrlBrokerProxy();
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const blob = new Blob([bytes], { type: 'image/bmp' });

      await expect(fileReadDataUrlBroker({ blob })).rejects.toThrow(/Invalid image data URL/u);
    });

    it('INVALID: {blob: no type at all} => rejects because the data url carries no media type', async () => {
      fileReadDataUrlBrokerProxy();
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const blob = new Blob([bytes]);

      await expect(fileReadDataUrlBroker({ blob })).rejects.toThrow(/Invalid image data URL/u);
    });
  });
});
