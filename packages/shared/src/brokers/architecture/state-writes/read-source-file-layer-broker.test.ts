import { readSourceFileLayerBroker } from './read-source-file-layer-broker';
import { readSourceFileLayerBrokerProxy } from './read-source-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readSourceFileLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {file present} => returns file contents', () => {
      const proxy = readSourceFileLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/broker.ts' });
      const content = ContentTextStub({ value: 'export const foo = () => {};' });

      proxy.setupReturns({ content });

      const result = readSourceFileLayerBroker({ filePath });

      expect(result).toBe('export const foo = () => {};');
    });
  });

  describe('file missing', () => {
    it('ERROR: {file missing} => returns undefined', () => {
      const proxy = readSourceFileLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/repo/packages/server/src/missing.ts' });

      proxy.setupMissing();

      const result = readSourceFileLayerBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
