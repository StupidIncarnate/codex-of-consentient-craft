import { routeMetadataContract } from './route-metadata-contract';
import { RouteMetadataStub } from './route-metadata.stub';

describe('routeMetadataContract', () => {
  describe('valid inputs', () => {
    it('VALID: {path Route} => parses with path string', () => {
      const result = RouteMetadataStub({
        path: '/:guildSlug/quest',
        responderSymbol: 'AppQuestChatResponder',
      });

      expect(result).toStrictEqual({
        path: '/:guildSlug/quest',
        responderSymbol: 'AppQuestChatResponder',
      });
    });

    it('VALID: {layout Route} => parses with null path', () => {
      const result = RouteMetadataStub({
        path: null,
        responderSymbol: 'AppLayoutResponder',
      });

      expect(result).toStrictEqual({
        path: null,
        responderSymbol: 'AppLayoutResponder',
      });
    });

    it('VALID: default stub => returns / + AppHomeResponder', () => {
      const result = RouteMetadataStub();

      expect(result).toStrictEqual({
        path: '/',
        responderSymbol: 'AppHomeResponder',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing responderSymbol} => throws ZodError', () => {
      expect(() =>
        routeMetadataContract.parse({
          path: '/',
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
