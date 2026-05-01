import { readFlowSourceLayerBroker } from './read-flow-source-layer-broker';
import { readFlowSourceLayerBrokerProxy } from './read-flow-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/mcp/src/flows/architecture/architecture-flow.ts',
});

describe('readFlowSourceLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {readable file} => returns the file content as ContentText', () => {
      const proxy = readFlowSourceLayerBrokerProxy();
      const content = ContentTextStub({ value: 'export const ArchFlow = () => [];' });
      proxy.setupReturns({ content });

      const result = readFlowSourceLayerBroker({ filePath: FILE_PATH });

      expect(String(result)).toBe('export const ArchFlow = () => [];');
    });
  });

  describe('file does not exist', () => {
    it('ERROR: {file missing, readFileSync throws} => returns undefined', () => {
      const proxy = readFlowSourceLayerBrokerProxy();
      proxy.setupMissing();

      const result = readFlowSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
