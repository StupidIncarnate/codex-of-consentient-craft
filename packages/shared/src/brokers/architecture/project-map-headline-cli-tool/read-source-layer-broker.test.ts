import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/ward/src/flows/ward/ward-flow.ts',
});

describe('readSourceLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {existing file} => returns file content', () => {
      const proxy = readSourceLayerBrokerProxy();
      const content = ContentTextStub({ value: 'export const WardFlow = () => {};' });
      proxy.setupReturns({ content });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(String(content));
    });
  });

  describe('file does not exist', () => {
    it('EMPTY: {missing file} => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupMissing();

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
