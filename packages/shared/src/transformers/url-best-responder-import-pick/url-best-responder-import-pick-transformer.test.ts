import { urlBestResponderImportPickTransformer } from './url-best-responder-import-pick-transformer';

describe('urlBestResponderImportPickTransformer', () => {
  describe('empty imports list', () => {
    it('EMPTY: {responderImports: []} => returns null', () => {
      const urlPattern = '/api/quests/:questId/start';

      const result = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports: [],
      });

      expect(result).toBe(null);
    });
  });

  describe('single import', () => {
    it('VALID: {single responder} => returns that import', () => {
      const urlPattern = '/api/quests/:questId/start';
      const responderImport = '../../responders/quest/start/quest-start-responder';

      const result = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports: [responderImport],
      });

      expect(result).toBe(responderImport);
    });
  });

  describe('multiple imports', () => {
    it('VALID: {two imports, one matches URL keywords} => returns highest-scoring import', () => {
      const urlPattern = '/api/quests/:questId/start';
      const startImport = '../../responders/quest/start/quest-start-responder';
      const listImport = '../../responders/quest/list/quest-list-responder';

      const result = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports: [startImport, listImport],
      });

      expect(result).toBe(startImport);
    });

    it('VALID: {two imports in reversed order, one matches URL keywords} => returns highest-scoring import', () => {
      const urlPattern = '/api/quests/:questId/start';
      const startImport = '../../responders/quest/start/quest-start-responder';
      const listImport = '../../responders/quest/list/quest-list-responder';

      const result = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports: [listImport, startImport],
      });

      expect(result).toBe(startImport);
    });

    it('VALID: {no keyword match, two imports} => returns first import as tiebreak', () => {
      const urlPattern = '/api/health';
      const firstImport = '../../responders/quest/start/quest-start-responder';
      const secondImport = '../../responders/quest/list/quest-list-responder';

      const result = urlBestResponderImportPickTransformer({
        urlPattern,
        responderImports: [firstImport, secondImport],
      });

      expect(result).toBe(firstImport);
    });
  });
});
