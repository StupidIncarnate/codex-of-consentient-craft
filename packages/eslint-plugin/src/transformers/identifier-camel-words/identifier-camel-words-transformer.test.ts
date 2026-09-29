import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';

import { identifierCamelWordsTransformer } from './identifier-camel-words-transformer';

describe('identifierCamelWordsTransformer', () => {
  describe('camelCase names', () => {
    it("VALID: {identifier: 'questId'} => returns ['quest', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: IdentifierStub({ value: 'questId' }),
      });

      expect(result).toStrictEqual(['quest', 'id']);
    });

    it("VALID: {identifier: 'parentWorkItemId'} => returns ['parent', 'work', 'item', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: IdentifierStub({ value: 'parentWorkItemId' }),
      });

      expect(result).toStrictEqual(['parent', 'work', 'item', 'id']);
    });

    it("VALID: {identifier: 'requestId'} => returns ['request', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: IdentifierStub({ value: 'requestId' }),
      });

      expect(result).toStrictEqual(['request', 'id']);
    });
  });

  describe('single words and acronyms', () => {
    it("EDGE: {identifier: 'id'} => returns ['id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: IdentifierStub({ value: 'id' }),
      });

      expect(result).toStrictEqual(['id']);
    });

    it("EDGE: {identifier: 'httpServerId'} => returns ['http', 'server', 'id']", () => {
      const result = identifierCamelWordsTransformer({
        identifier: IdentifierStub({ value: 'httpServerId' }),
      });

      expect(result).toStrictEqual(['http', 'server', 'id']);
    });
  });
});
