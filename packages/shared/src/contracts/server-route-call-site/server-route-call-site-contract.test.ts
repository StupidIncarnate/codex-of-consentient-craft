import { serverRouteCallSiteContract } from './server-route-call-site-contract';
import { ServerRouteCallSiteStub } from './server-route-call-site.stub';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('serverRouteCallSiteContract', () => {
  describe('valid inputs', () => {
    it('VALID: {statics ref + responder name} => parses successfully', () => {
      const result = ServerRouteCallSiteStub({
        method: ContentTextStub({ value: 'GET' }),
        rawArg: ContentTextStub({ value: 'apiRoutesStatics.quests.list' }),
        responderName: ContentTextStub({ value: 'QuestListResponder' }),
      });

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'apiRoutesStatics.quests.list',
        responderName: 'QuestListResponder',
      });
    });

    it('VALID: {POST method with inline path} => parses with POST', () => {
      const result = ServerRouteCallSiteStub({
        method: ContentTextStub({ value: 'POST' }),
        rawArg: ContentTextStub({ value: '/api/quests/:questId/start' }),
        responderName: ContentTextStub({ value: 'QuestStartResponder' }),
      });

      expect(result).toStrictEqual({
        method: 'POST',
        rawArg: '/api/quests/:questId/start',
        responderName: 'QuestStartResponder',
      });
    });

    it('VALID: {responderName: null} => allowed for inline-handler routes (e.g. health)', () => {
      const result = ServerRouteCallSiteStub({
        method: ContentTextStub({ value: 'GET' }),
        rawArg: ContentTextStub({ value: '/api/health' }),
        responderName: null,
      });

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: '/api/health',
        responderName: null,
      });
    });

    it('VALID: default stub => returns GET with quests.list route + QuestListResponder', () => {
      const result = ServerRouteCallSiteStub();

      expect(result).toStrictEqual({
        method: 'GET',
        rawArg: 'apiRoutesStatics.quests.list',
        responderName: 'QuestListResponder',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {missing method} => throws ZodError', () => {
      expect(() =>
        serverRouteCallSiteContract.parse({
          rawArg: 'apiRoutesStatics.quests.list',
          responderName: 'QuestListResponder',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing rawArg} => throws ZodError', () => {
      expect(() =>
        serverRouteCallSiteContract.parse({
          method: 'GET',
          responderName: 'QuestListResponder',
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing responderName} => throws ZodError', () => {
      expect(() =>
        serverRouteCallSiteContract.parse({
          method: 'GET',
          rawArg: 'apiRoutesStatics.quests.list',
        }),
      ).toThrow(/Required/u);
    });
  });
});
