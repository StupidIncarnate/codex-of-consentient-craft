import { serverLogReaderLayerBroker } from './server-log-reader-layer-broker';
import { serverLogReaderLayerBrokerProxy } from './server-log-reader-layer-broker.proxy';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

describe('serverLogReaderLayerBroker', () => {
  describe('serverLogLength()', () => {
    it('VALID: {log content} => returns its byte length', () => {
      const proxy = serverLogReaderLayerBrokerProxy();
      const logPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/inst_1/api-server.log' });
      proxy.setupLogContent({
        logPath,
        content: ContentTextStub({ value: 'line one\nline two\n' }),
      });

      const { serverLogLength } = serverLogReaderLayerBroker({ logPath });

      expect(serverLogLength()).toBe(18);
    });

    it('EMPTY: {no content yet} => returns 0', () => {
      const proxy = serverLogReaderLayerBrokerProxy();
      const logPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/inst_1/api-server.log' });
      proxy.setupLogContent({ logPath, content: ContentTextStub({ value: '' }) });

      const { serverLogLength } = serverLogReaderLayerBroker({ logPath });

      expect(serverLogLength()).toBe(0);
    });
  });

  describe('readServerLogSince()', () => {
    it('VALID: {fromByte: 0} => returns every non-empty line', () => {
      const proxy = serverLogReaderLayerBrokerProxy();
      const logPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/inst_1/api-server.log' });
      proxy.setupLogContent({
        logPath,
        content: ContentTextStub({ value: 'line one\nline two\n' }),
      });

      const { readServerLogSince } = serverLogReaderLayerBroker({ logPath });

      expect(readServerLogSince({ fromByte: 0 })).toStrictEqual(['line one', 'line two']);
    });

    it('VALID: {fromByte: midway} => returns only the lines written after that offset', () => {
      const proxy = serverLogReaderLayerBrokerProxy();
      const logPath = AbsoluteFilePathStub({ value: '/repo/.siegelense/inst_1/api-server.log' });
      proxy.setupLogContent({
        logPath,
        content: ContentTextStub({ value: 'line one\nline two\n' }),
      });

      const { readServerLogSince } = serverLogReaderLayerBroker({ logPath });

      expect(readServerLogSince({ fromByte: 9 })).toStrictEqual(['line two']);
    });
  });
});
