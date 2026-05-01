import { flowNameFromFilePathTransformer } from './flow-name-from-file-path-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('flowNameFromFilePathTransformer', () => {
  describe('typical flow display paths', () => {
    it('VALID: {quest flow} => returns quest', () => {
      const displayName = ContentTextStub({ value: 'flows/quest/quest-flow' });
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe(ContentTextStub({ value: 'quest' }));
    });

    it('VALID: {server flow} => returns server', () => {
      const displayName = ContentTextStub({ value: 'flows/server/server-flow' });
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe(ContentTextStub({ value: 'server' }));
    });

    it('VALID: {health flow} => returns health', () => {
      const displayName = ContentTextStub({ value: 'flows/health/health-flow' });
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe(ContentTextStub({ value: 'health' }));
    });
  });

  describe('names without -flow suffix', () => {
    it('EDGE: {stem without -flow} => returns stem unchanged', () => {
      const displayName = ContentTextStub({ value: 'flows/quest/quest-handler' });
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe(ContentTextStub({ value: 'quest-handler' }));
    });
  });
});
