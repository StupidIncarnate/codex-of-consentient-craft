import { serverRouteCallsExtractTransformer } from './server-route-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('serverRouteCallsExtractTransformer', () => {
  describe('statics member-expression args', () => {
    it('VALID: {app.get with statics ref + responder body} => returns method, ref, responder', () => {
      const source = ContentTextStub({
        value:
          'app.get(apiRoutesStatics.quests.list, async (c) => { const r = await QuestListResponder({}); });',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          rawArg: 'apiRoutesStatics.quests.list',
          responderName: 'QuestListResponder',
        },
      ]);
    });

    it('VALID: {app.post with statics ref + responder body} => returns POST tuple', () => {
      const source = ContentTextStub({
        value:
          'app.post(apiRoutesStatics.quests.start, async (c) => { const r = await QuestStartResponder({}); });',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          method: 'POST',
          rawArg: 'apiRoutesStatics.quests.start',
          responderName: 'QuestStartResponder',
        },
      ]);
    });

    it('VALID: {app.patch with statics ref + responder body} => returns PATCH tuple', () => {
      const source = ContentTextStub({
        value:
          'app.patch(apiRoutesStatics.quests.byId, async (c) => { const r = await QuestModifyResponder({}); });',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          method: 'PATCH',
          rawArg: 'apiRoutesStatics.quests.byId',
          responderName: 'QuestModifyResponder',
        },
      ]);
    });

    it('VALID: {app.delete with statics ref + responder body} => returns DELETE tuple', () => {
      const source = ContentTextStub({
        value:
          'app.delete(apiRoutesStatics.quests.delete, async (c) => { const r = await QuestDeleteResponder({}); });',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          method: 'DELETE',
          rawArg: 'apiRoutesStatics.quests.delete',
          responderName: 'QuestDeleteResponder',
        },
      ]);
    });
  });

  describe('inline string literal args', () => {
    it('VALID: {app.get inline-handler with no responder} => responderName=null', () => {
      const source = ContentTextStub({
        value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'GET', rawArg: '/api/health', responderName: null }]);
    });

    it('VALID: {app.post with double-quoted literal + responder body} => paired tuple', () => {
      const source = ContentTextStub({
        value:
          'app.post("/api/quests", async (c) => { const r = await QuestUserAddResponder({}); });',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'POST', rawArg: '/api/quests', responderName: 'QuestUserAddResponder' },
      ]);
    });
  });

  describe('multiple routes', () => {
    it('VALID: {multiple app.<method> calls each with their own responder} => pairs each call to its body responder', () => {
      const source = ContentTextStub({
        value: [
          'app.get(apiRoutesStatics.quests.list, async (c) => { await QuestListResponder({}); });',
          'app.post(apiRoutesStatics.quests.list, async (c) => { await QuestUserAddResponder({}); });',
          'app.patch(apiRoutesStatics.quests.byId, async (c) => { await QuestModifyResponder({}); });',
        ].join('\n'),
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        {
          method: 'GET',
          rawArg: 'apiRoutesStatics.quests.list',
          responderName: 'QuestListResponder',
        },
        {
          method: 'POST',
          rawArg: 'apiRoutesStatics.quests.list',
          responderName: 'QuestUserAddResponder',
        },
        {
          method: 'PATCH',
          rawArg: 'apiRoutesStatics.quests.byId',
          responderName: 'QuestModifyResponder',
        },
      ]);
    });
  });

  describe('empty source', () => {
    it('EMPTY: {source with no route registrations} => returns empty array', () => {
      const source = ContentTextStub({
        value: 'import { Hono } from "hono";\nconst app = new Hono();',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
