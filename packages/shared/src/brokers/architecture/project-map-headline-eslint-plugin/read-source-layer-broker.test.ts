import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({
  value:
    '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
});

const FILE_CONTENT = ContentTextStub({ value: '/** * PURPOSE: Bans raw primitives */' });

describe('readSourceLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {readable file} => returns ContentText', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupReturns({ content: FILE_CONTENT });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toStrictEqual(FILE_CONTENT);
    });
  });

  describe('file missing', () => {
    it('ERROR: {readFile throws ENOENT} => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupMissing();

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
