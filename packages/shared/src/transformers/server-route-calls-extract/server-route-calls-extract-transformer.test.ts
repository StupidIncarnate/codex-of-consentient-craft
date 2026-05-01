import { serverRouteCallsExtractTransformer } from './server-route-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('serverRouteCallsExtractTransformer', () => {
  describe('statics member-expression args', () => {
    it('VALID: {app.get with statics ref} => returns GET with full statics ref as rawArg', () => {
      const source = ContentTextStub({
        value: 'app.get(apiRoutesStatics.quests.list, async (c) => {});',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'GET', rawArg: 'apiRoutesStatics.quests.list' }]);
    });

    it('VALID: {app.post with statics ref} => returns POST with statics ref', () => {
      const source = ContentTextStub({
        value: 'app.post(apiRoutesStatics.quests.start, async (c) => {});',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'POST', rawArg: 'apiRoutesStatics.quests.start' }]);
    });

    it('VALID: {app.patch with statics ref} => returns PATCH', () => {
      const source = ContentTextStub({
        value: 'app.patch(apiRoutesStatics.quests.byId, async (c) => {});',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'PATCH', rawArg: 'apiRoutesStatics.quests.byId' }]);
    });

    it('VALID: {app.delete with statics ref} => returns DELETE', () => {
      const source = ContentTextStub({
        value: 'app.delete(apiRoutesStatics.quests.delete, async (c) => {});',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'DELETE', rawArg: 'apiRoutesStatics.quests.delete' },
      ]);
    });
  });

  describe('inline string literal args', () => {
    it('VALID: {app.get with single-quoted literal} => returns GET with literal path', () => {
      const source = ContentTextStub({
        value: "app.get('/api/health', (c) => c.json({ status: 'ok' }));",
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'GET', rawArg: '/api/health' }]);
    });

    it('VALID: {app.post with double-quoted literal} => returns POST with literal path', () => {
      const source = ContentTextStub({
        value: 'app.post("/api/quests", async (c) => {});',
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'POST', rawArg: '/api/quests' }]);
    });
  });

  describe('multiple routes', () => {
    it('VALID: {multiple app.<method> calls} => returns all routes in order', () => {
      const source = ContentTextStub({
        value: [
          'app.get(apiRoutesStatics.quests.list, async (c) => {});',
          'app.post(apiRoutesStatics.quests.list, async (c) => {});',
          'app.patch(apiRoutesStatics.quests.byId, async (c) => {});',
        ].join('\n'),
      });

      const result = serverRouteCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'GET', rawArg: 'apiRoutesStatics.quests.list' },
        { method: 'POST', rawArg: 'apiRoutesStatics.quests.list' },
        { method: 'PATCH', rawArg: 'apiRoutesStatics.quests.byId' },
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
