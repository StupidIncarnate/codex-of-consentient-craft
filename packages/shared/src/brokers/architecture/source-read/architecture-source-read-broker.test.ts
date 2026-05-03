import { architectureSourceReadBroker } from './architecture-source-read-broker';
import { architectureSourceReadBrokerProxy } from './architecture-source-read-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('architectureSourceReadBroker', () => {
  describe('existing file', () => {
    it('VALID: {readable file} => returns file content', () => {
      const proxy = architectureSourceReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/bindings/use-quest/use-quest-binding.ts',
      });
      const content = ContentTextStub({
        value: "import { questFetcher } from '../../brokers/quest/quest-broker';",
      });

      proxy.setupReturns({ content });

      const result = architectureSourceReadBroker({ filePath });

      expect(result).toBe(content);
    });
  });

  describe('missing file', () => {
    it('EMPTY: {file not found} => returns undefined', () => {
      const proxy = architectureSourceReadBrokerProxy();
      const filePath = AbsoluteFilePathStub({
        value: '/repo/packages/web/src/bindings/missing/missing-binding.ts',
      });

      proxy.setupMissing();

      const result = architectureSourceReadBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
