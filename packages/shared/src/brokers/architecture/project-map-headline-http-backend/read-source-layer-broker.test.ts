import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readSourceLayerBroker', () => {
  describe('existing file', () => {
    it('VALID: {readable file} => returns file content', () => {
      const proxy = readSourceLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/quest/quest-flow.ts',
      });
      const content = ContentTextStub({
        value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
      });

      proxy.setupReturns({ content });

      const result = readSourceLayerBroker({ filePath });

      expect(result).toBe(content);
    });
  });

  describe('missing file', () => {
    it('EMPTY: {file not found} => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/flows/missing/missing-flow.ts',
      });

      proxy.setupMissing();

      const result = readSourceLayerBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
