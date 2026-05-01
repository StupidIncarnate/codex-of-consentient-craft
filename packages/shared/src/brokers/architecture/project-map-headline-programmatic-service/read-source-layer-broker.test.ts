import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/orchestrator/src/startup/start-orchestrator.ts',
});

describe('readSourceLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {readable file} => returns the file content as ContentText', () => {
      const proxy = readSourceLayerBrokerProxy();
      const content = ContentTextStub({
        value: 'export const StartOrchestrator = { listGuilds: async () => [] };',
      });
      proxy.setupReturns({ content });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(String(result)).toBe(
        'export const StartOrchestrator = { listGuilds: async () => [] };',
      );
    });
  });

  describe('file does not exist', () => {
    it('ERROR: {file missing, readFileSync throws} => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupMissing();

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
