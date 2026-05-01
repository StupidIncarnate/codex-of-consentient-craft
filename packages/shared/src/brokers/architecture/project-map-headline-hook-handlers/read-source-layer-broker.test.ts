import { readSourceLayerBroker } from './read-source-layer-broker';
import { readSourceLayerBrokerProxy } from './read-source-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const FILE_PATH = AbsoluteFilePathStub({
  value: '/repo/packages/hooks/src/flows/hook-pre-edit/hook-pre-edit-flow.ts',
});
const SOURCE = ContentTextStub({ value: `export const HookPreEditFlow = async () => {};` });

describe('readSourceLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {readable file} => returns file content', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupReturns({ content: SOURCE });

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(String(SOURCE));
    });
  });

  describe('file missing', () => {
    it('EMPTY: {ENOENT thrown} => returns undefined', () => {
      const proxy = readSourceLayerBrokerProxy();
      proxy.setupMissing();

      const result = readSourceLayerBroker({ filePath: FILE_PATH });

      expect(result).toBe(undefined);
    });
  });
});
