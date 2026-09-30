import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const FILE_PATH = '/repo/packages/web/src/widgets/app-widget.ts';

describe('readSourceLayerBroker', () => {
  describe('successful read', () => {
    it('VALID: existing file => returns content', () => {
      const proxy = readSourceLayerBrokerProxy();
      const content = "import { x } from '@dungeonmaster/shared/contracts';";
      proxy.returns({ filePath: FILE_PATH, content });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(content);
    });
  });

  describe('error handling', () => {
    it('ERROR: missing file => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.throws({ filePath: FILE_PATH, error: FileMissingErrorStub({ path: FILE_PATH }) });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
