import { webFetchCallSiteContract } from './web-fetch-call-site-contract';
import { WebFetchCallSiteStub } from './web-fetch-call-site.stub';

describe('webFetchCallSiteContract', () => {
  describe('valid inputs', () => {
    it('VALID: {statics ref} => parses successfully', () => {
      const result = WebFetchCallSiteStub({
        method: 'GET',
        rawArg: 'webConfigStatics.api.routes.quests',
      });

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'webConfigStatics.api.routes.quests',
      });
    });

    it('VALID: {POST method} => parses with POST', () => {
      const result = WebFetchCallSiteStub({
        method: 'POST',
        rawArg: 'webConfigStatics.api.routes.questStart',
      });

      expect(result).toStrictEqual({
        method: 'POST',
        rawArg: 'webConfigStatics.api.routes.questStart',
      });
    });

    it('VALID: default stub => returns GET with quests route', () => {
      const result = WebFetchCallSiteStub();

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'webConfigStatics.api.routes.quests',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing method} => throws ZodError', () => {
      expect(() =>
        webFetchCallSiteContract.parse({
          rawArg: 'webConfigStatics.api.routes.quests',
        }),
      ).toThrow(/received undefined/u);
    });

    it('INVALID: {missing rawArg} => throws ZodError', () => {
      expect(() =>
        webFetchCallSiteContract.parse({
          method: 'GET',
        }),
      ).toThrow(/received undefined/u);
    });
  });
});
