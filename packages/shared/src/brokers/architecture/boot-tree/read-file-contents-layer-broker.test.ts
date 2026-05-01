import { readFileContentsLayerBroker } from './read-file-contents-layer-broker';
import { readFileContentsLayerBrokerProxy } from './read-file-contents-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

describe('readFileContentsLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: {existing file} => returns content', () => {
      const proxy = readFileContentsLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/project/src/startup/start-app.ts' });
      const content = ContentTextStub({ value: 'import { foo } from "./foo";' });
      proxy.setupReturns({ content });
      const result = readFileContentsLayerBroker({ filePath });

      expect(result).toBe(content);
    });
  });

  describe('error handling', () => {
    it('ERROR: {missing file} => returns undefined', () => {
      const proxy = readFileContentsLayerBrokerProxy();
      const filePath = AbsoluteFilePathStub({ value: '/project/src/startup/start-missing.ts' });
      proxy.setupMissing();
      const result = readFileContentsLayerBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
