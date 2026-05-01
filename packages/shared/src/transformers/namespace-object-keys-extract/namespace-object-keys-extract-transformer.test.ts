import { namespaceObjectKeysExtractTransformer } from './namespace-object-keys-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('namespaceObjectKeysExtractTransformer', () => {
  describe('no namespace object', () => {
    it('EMPTY: {source with no exported const object} => returns empty array', () => {
      const result = namespaceObjectKeysExtractTransformer({
        source: ContentTextStub({ value: 'const x = 1;' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('single method', () => {
    it('VALID: {one method in exported namespace} => returns that method name', () => {
      const result = namespaceObjectKeysExtractTransformer({
        source: ContentTextStub({
          value: 'export const StartOrchestrator = {\n  listGuilds: async () => [],\n};\n',
        }),
      });

      expect(result.map(String)).toStrictEqual(['listGuilds']);
    });
  });

  describe('multiple methods', () => {
    it('VALID: {multiple methods} => returns all method names in order', () => {
      const result = namespaceObjectKeysExtractTransformer({
        source: ContentTextStub({
          value:
            'export const StartOrchestrator = {\n  listGuilds: async () => [],\n  addGuild: async () => ({}),\n  startQuest: async () => ({}),\n};\n',
        }),
      });

      expect(result.map(String)).toStrictEqual(['listGuilds', 'addGuild', 'startQuest']);
    });

    it('VALID: {duplicate method names} => deduplicates', () => {
      const result = namespaceObjectKeysExtractTransformer({
        source: ContentTextStub({
          value:
            'export const Start = {\n  doThing: async () => {},\n  doThing: async () => {},\n};\n',
        }),
      });

      expect(result.map(String)).toStrictEqual(['doThing']);
    });
  });

  describe('nested braces', () => {
    it('VALID: {method with inline object type annotation} => still extracts top-level method names', () => {
      const result = namespaceObjectKeysExtractTransformer({
        source: ContentTextStub({
          value:
            'export const Start = {\n  addQuest: async ({ guildId }: { guildId: GuildId }) => ({}),\n  getQuest: async ({ questId }: { questId: QuestId }) => ({}),\n};\n',
        }),
      });

      expect(result.map(String)).toStrictEqual(['addQuest', 'getQuest']);
    });
  });
});
