import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({ value: '/repo/packages/web/src/widgets/app-widget.ts' });

describe('readSourceLayerBroker', () => {
  describe('successful read', () => {
    it('VALID: existing file => returns content', () => {
      const proxy = readSourceLayerBrokerProxy();
      const content = ContentTextStub({
        value: "import { x } from '@dungeonmaster/shared/contracts';",
      });
      proxy.returns({ content });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(content);
    });
  });

  describe('error handling', () => {
    it('ERROR: missing file => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.throws({ error: new Error('ENOENT') });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
