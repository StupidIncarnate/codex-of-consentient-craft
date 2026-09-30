
import { identifierCamelWordsTransformer } from './identifier-camel-words-transformer';

describe('identifierCamelWordsTransformer', () => {
  describe('camelCase names', () => {
    it("VALID: {identifier: 'questId'} => returns ['quest', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: 'questId',
      });

      expect(result).toStrictEqual(['quest', 'id']);
    });

    it("VALID: {identifier: 'parentWorkItemId'} => returns ['parent', 'work', 'item', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: 'parentWorkItemId',
      });

      expect(result).toStrictEqual(['parent', 'work', 'item', 'id']);
    });

    it("VALID: {identifier: 'requestId'} => returns ['request', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: 'requestId',
      });

      expect(result).toStrictEqual(['request', 'id']);
    });
  });

  describe('single words and acronyms', () => {
    it("EDGE: {identifier: 'id'} => returns ['id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: 'id',
      });

      expect(result).toStrictEqual(['id']);
    });

    it("EDGE: {identifier: 'httpServerId'} => returns ['http', 'server', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: 'httpServerId',
      });

      expect(result).toStrictEqual(['http', 'server', 'id']);
    });
  });
});
