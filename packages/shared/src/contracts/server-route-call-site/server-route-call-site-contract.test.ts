import { serverRouteCallSiteContract } from './server-route-call-site-contract';
import { ServerRouteCallSiteStub } from './server-route-call-site.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('serverRouteCallSiteContract', () => {
  describe('valid inputs', () => {
    it('VALID: {statics ref} => parses successfully', () => {
      const result = ServerRouteCallSiteStub({
        method: ContentTextStub({ value: 'GET' }),
        rawArg: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
      });

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'apiRoutesStatics.quests.list',
      });
    });

    it('VALID: {POST method with inline path} => parses with POST', () => {
      const result = ServerRouteCallSiteStub({
        method: ContentTextStub({ value: 'POST' }),
        rawArg: ContentTextStub({ value: '/api/quests/:questId/start' }),
      });

      expect(result).toStrictEqual({
        method: 'POST',
        rawArg: '/api/quests/:questId/start',
      });
    });

    it('VALID: default stub => returns GET with quests.list route', () => {
      const result = ServerRouteCallSiteStub();

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'apiRoutesStatics.quests.list',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing method} => throws ZodError', () => {
      expect(() =>
        serverRouteCallSiteContract.parse({
          rawArg: 'apiRoutesStatics.quests.list',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing rawArg} => throws ZodError', () => {
      expect(() =>
        serverRouteCallSiteContract.parse({
          method: 'GET',
        }),
      ).toThrow(/Required/u);
    });
  });
});
