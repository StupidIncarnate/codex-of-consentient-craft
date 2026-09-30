import { ClipboardPayloadStub } from '../../../contracts/clipboard-payload/clipboard-payload.stub';
import { pastePayloadLayerBroker } from './paste-payload-layer-broker';
import { pastePayloadLayerBrokerProxy } from './paste-payload-layer-broker.proxy';
import { Buffer } from '#gateway/node/buffer';

describe('pastePayloadLayerBroker', () => {
  describe('a value', () => {
    it('VALID: {value, no file} => returns a text payload and reads no file', () => {
      const proxy = pastePayloadLayerBrokerProxy();

      const result = pastePayloadLayerBroker({ filePath: null, value: 'hello world' });

      expect({ result, reads: proxy.getReadPaths() }).toStrictEqual({
        result: ClipboardPayloadStub({ kind: 'text', text: 'hello world' }),
        reads: [],
      });
    });

    it('VALID: {value and an existing file} => the value wins, and the file is never read', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/test-image.png';
      proxy.setupFileExists({ filePath, content: Buffer.from('fake-png') });

      const result = pastePayloadLayerBroker({ filePath, value: 'typed' });

      expect({ result, reads: proxy.getReadPaths() }).toStrictEqual({
        result: ClipboardPayloadStub({ kind: 'text', text: 'typed' }),
        reads: [],
      });
    });
  });

  describe('a file', () => {
    it('VALID: {filePath: a .png} => returns its bytes as base64 with the png mime type', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/test-image.png';
      proxy.setupFileExists({ filePath, content: Buffer.from('fake-png') });

      const result = pastePayloadLayerBroker({ filePath, value: null });

      expect(result).toStrictEqual({
        kind: 'file',
        base64: Buffer.from('fake-png').toString('base64'),
        mimeType: 'image/png',
      });
    });

    it('VALID: {filePath: an upper-case .JPEG} => the extension is matched case-insensitively', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/PHOTO.JPEG';
      proxy.setupFileExists({ filePath, content: Buffer.from('fake-jpeg') });

      const result = pastePayloadLayerBroker({ filePath, value: null });

      expect(result).toStrictEqual({
        kind: 'file',
        base64: Buffer.from('fake-jpeg').toString('base64'),
        mimeType: 'image/jpeg',
      });
    });

    it('EDGE: {filePath: an unknown extension} => falls back to the default mime type', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/data.custom';
      proxy.setupFileExists({ filePath, content: Buffer.from('fake-custom') });

      const result = pastePayloadLayerBroker({ filePath, value: null });

      expect(result).toStrictEqual({
        kind: 'file',
        base64: Buffer.from('fake-custom').toString('base64'),
        mimeType: 'application/octet-stream',
      });
    });

    it('EDGE: {filePath: no extension} => falls back to the default mime type', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/README';
      proxy.setupFileExists({ filePath, content: Buffer.from('plain') });

      const result = pastePayloadLayerBroker({ filePath, value: null });

      expect(result).toStrictEqual({
        kind: 'file',
        base64: Buffer.from('plain').toString('base64'),
        mimeType: 'application/octet-stream',
      });
    });
  });

  describe('refusals', () => {
    it('ERROR: {filePath that does not exist} => throws naming the file', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/nonexistent.png';
      proxy.setupFileNotFound({ filePath });

      expect(() => pastePayloadLayerBroker({ filePath, value: null })).toThrow(
        /^file at "\/tmp\/nonexistent\.png" does not exist$/u,
      );
    });

    it('ERROR: {a value, but a filePath that does not exist} => still throws naming the file', () => {
      const proxy = pastePayloadLayerBrokerProxy();
      const filePath = '/tmp/nonexistent.png';
      proxy.setupFileNotFound({ filePath });

      expect(() => pastePayloadLayerBroker({ filePath, value: 'typed' })).toThrow(
        /^file at "\/tmp\/nonexistent\.png" does not exist$/u,
      );
    });

    it('EMPTY: {neither filePath nor value} => throws', () => {
      pastePayloadLayerBrokerProxy();

      expect(() => pastePayloadLayerBroker({ filePath: null, value: null })).toThrow(
        /^either filePath or value must be provided$/u,
      );
    });
  });
});
