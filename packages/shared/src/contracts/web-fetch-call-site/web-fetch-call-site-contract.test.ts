import { webFetchCallSiteContract } from './web-fetch-call-site-contract';
import { WebFetchCallSiteStub } from './web-fetch-call-site.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('webFetchCallSiteContract', () => {
  describe('valid inputs', () => {
    it('VALID: {statics ref} => parses successfully', () => {
      const result = WebFetchCallSiteStub({
        method: ContentTextStub({ value: 'GET' }),
        rawArg: ContentTextStub({ value: 'webConfigStatics.api.routes.quests' }),
      });

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'webConfigStatics.api.routes.quests',
      });
    });

    it('VALID: {POST method} => parses with POST', () => {
      const result = WebFetchCallSiteStub({
        method: ContentTextStub({ value: 'POST' }),
        rawArg: ContentTextStub({ value: 'webConfigStatics.api.routes.questStart' }),
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
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing rawArg} => throws ZodError', () => {
      expect(() =>
        webFetchCallSiteContract.parse({
          method: 'GET',
        }),
      ).toThrow(/Required/u);
    });
  });
});
