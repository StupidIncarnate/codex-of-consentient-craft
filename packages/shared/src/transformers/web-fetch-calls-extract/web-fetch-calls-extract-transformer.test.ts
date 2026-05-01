import { webFetchCallsExtractTransformer } from './web-fetch-calls-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('webFetchCallsExtractTransformer', () => {
  describe('statics member-expression url args', () => {
    it('VALID: {fetchGetAdapter with statics url ref} => returns GET with statics ref', () => {
      const source = ContentTextStub({
        value: 'fetchGetAdapter<Quest[]>({ url: webConfigStatics.api.routes.quests });',
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'GET', rawArg: 'webConfigStatics.api.routes.quests' },
      ]);
    });

    it('VALID: {fetchPostAdapter with statics url ref + .replace} => returns POST with statics ref (ignoring .replace)', () => {
      const source = ContentTextStub({
        value:
          "fetchPostAdapter<{processId: ProcessId}>({ url: webConfigStatics.api.routes.questStart.replace(':questId', questId), body: {} });",
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'POST', rawArg: 'webConfigStatics.api.routes.questStart' },
      ]);
    });

    it('VALID: {fetchPatchAdapter} => returns PATCH', () => {
      const source = ContentTextStub({
        value:
          "fetchPatchAdapter({ url: webConfigStatics.api.routes.questById.replace(':questId', questId), body: input });",
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'PATCH', rawArg: 'webConfigStatics.api.routes.questById' },
      ]);
    });

    it('VALID: {fetchDeleteAdapter} => returns DELETE', () => {
      const source = ContentTextStub({
        value:
          "fetchDeleteAdapter({ url: webConfigStatics.api.routes.questById.replace(':questId', questId) });",
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'DELETE', rawArg: 'webConfigStatics.api.routes.questById' },
      ]);
    });
  });

  describe('inline string literal url args', () => {
    it('VALID: {fetchGetAdapter with single-quoted literal} => returns GET with literal path', () => {
      const source = ContentTextStub({
        value: "fetchGetAdapter({ url: '/api/quests' });",
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'GET', rawArg: '/api/quests' }]);
    });

    it('VALID: {fetchPostAdapter with double-quoted literal} => returns POST with literal path', () => {
      const source = ContentTextStub({
        value: 'fetchPostAdapter({ url: "/api/quests", body: {} });',
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([{ method: 'POST', rawArg: '/api/quests' }]);
    });
  });

  describe('multiple calls', () => {
    it('VALID: {multiple fetch adapter calls} => returns all call sites in order', () => {
      const source = ContentTextStub({
        value: [
          'const q = await fetchGetAdapter({ url: webConfigStatics.api.routes.quests });',
          'const r = await fetchPostAdapter({ url: webConfigStatics.api.routes.questStart.replace(":questId", id), body: {} });',
        ].join('\n'),
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([
        { method: 'GET', rawArg: 'webConfigStatics.api.routes.quests' },
        { method: 'POST', rawArg: 'webConfigStatics.api.routes.questStart' },
      ]);
    });
  });

  describe('empty source', () => {
    it('EMPTY: {source with no fetch adapter calls} => returns empty array', () => {
      const source = ContentTextStub({
        value: 'import { fetchGetAdapter } from "../adapters/fetch/get/fetch-get-adapter";',
      });

      const result = webFetchCallsExtractTransformer({ source });

      expect(result).toStrictEqual([]);
    });
  });
});
