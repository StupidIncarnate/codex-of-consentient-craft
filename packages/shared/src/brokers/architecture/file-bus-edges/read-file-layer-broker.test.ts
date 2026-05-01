import { readFileLayerBroker } from './read-file-layer-broker';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE = AbsoluteFilePathStub({
  value:
    '/repo/packages/orchestrator/src/brokers/quest/outbox-append/quest-outbox-append-broker.ts',
});

describe('readFileLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {readable file} => returns file content', () => {
      const proxy = readFileLayerBrokerProxy();
      const content = ContentTextStub({ value: 'export const foo = 1;' });
      proxy.setupReturns({ content });

      const result = readFileLayerBroker({ filePath: FILE });

      expect(result).toBe(content);
    });
  });

  describe('file missing', () => {
    it('ERROR: {file throws ENOENT} => returns undefined', () => {
      const proxy = readFileLayerBrokerProxy();
      proxy.setupMissing();

      const result = readFileLayerBroker({ filePath: FILE });

      expect(result).toBe(undefined);
    });
  });
});
