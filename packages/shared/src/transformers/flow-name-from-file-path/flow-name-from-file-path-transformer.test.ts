import { flowNameFromFilePathTransformer } from './flow-name-from-file-path-transformer';

describe('flowNameFromFilePathTransformer', () => {
  describe('typical flow display paths', () => {
    it('VALID: {quest flow} => returns quest', () => {
      const displayName = 'flows/quest/quest-flow';
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe('quest');
    });

    it('VALID: {server flow} => returns server', () => {
      const displayName = 'flows/server/server-flow';
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe('server');
    });

    it('VALID: {health flow} => returns health', () => {
      const displayName = 'flows/health/health-flow';
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe('health');
    });
  });

  describe('names without -flow suffix', () => {
    it('EDGE: {stem without -flow} => returns stem unchanged', () => {
      const displayName = 'flows/quest/quest-handler';
      const result = flowNameFromFilePathTransformer({ displayName });

      expect(result).toBe('quest-handler');
    });
  });
});
