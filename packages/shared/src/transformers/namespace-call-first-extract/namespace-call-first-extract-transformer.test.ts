import { namespaceCallFirstExtractTransformer } from './namespace-call-first-extract-transformer';

describe('namespaceCallFirstExtractTransformer', () => {
  describe('source with namespace call', () => {
    it('VALID: {StartOrchestrator.startQuest call} => returns namespace.method token', () => {
      const source =
        'export const adapter = async ({ questId }) => StartOrchestrator.startQuest({ questId });';

      const result = namespaceCallFirstExtractTransformer({ source });

      expect(String(result)).toBe('StartOrchestrator.startQuest({...})');
    });

    it('VALID: {StartOrchestrator.listQuests call} => returns listQuests token', () => {
      const source = 'export const adapter = async () => StartOrchestrator.listQuests({});';

      const result = namespaceCallFirstExtractTransformer({ source });

      expect(String(result)).toBe('StartOrchestrator.listQuests({...})');
    });
  });

  describe('source with multiple namespace calls', () => {
    it('VALID: {two namespace calls} => returns first call token', () => {
      const source =
        'StartOrchestrator.getQuest({ questId }); StartOrchestrator.startQuest({ questId });';

      const result = namespaceCallFirstExtractTransformer({ source });

      expect(String(result)).toBe('StartOrchestrator.getQuest({...})');
    });
  });

  describe('source without namespace call', () => {
    it('EMPTY: {no uppercase namespace} => returns null', () => {
      const source = 'export const adapter = async () => fetch("/api/quests");';

      const result = namespaceCallFirstExtractTransformer({ source });

      expect(result).toBe(null);
    });

    it('EMPTY: {empty source} => returns null', () => {
      const source = '';

      const result = namespaceCallFirstExtractTransformer({ source });

      expect(result).toBe(null);
    });
  });
});
