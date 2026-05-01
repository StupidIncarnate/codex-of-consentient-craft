import { urlSegmentsExtractTransformer } from './url-segments-extract-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('urlSegmentsExtractTransformer', () => {
  describe('urlPattern with api prefix and param', () => {
    it('VALID: {/api/quests/:questId/start} => returns quests and start', () => {
      const urlPattern = ContentTextStub({ value: '/api/quests/:questId/start' });

      const result = urlSegmentsExtractTransformer({ urlPattern });

      expect(result.map(String)).toStrictEqual(['quests', 'start']);
    });
  });

  describe('urlPattern with only api prefix', () => {
    it('VALID: {/api/health} => returns health', () => {
      const urlPattern = ContentTextStub({ value: '/api/health' });

      const result = urlSegmentsExtractTransformer({ urlPattern });

      expect(result.map(String)).toStrictEqual(['health']);
    });
  });

  describe('urlPattern that is only param segments', () => {
    it('EDGE: {/:id/:sub} => returns empty array', () => {
      const urlPattern = ContentTextStub({ value: '/:id/:sub' });

      const result = urlSegmentsExtractTransformer({ urlPattern });

      expect(result.map(String)).toStrictEqual([]);
    });
  });

  describe('urlPattern with no segments', () => {
    it('EMPTY: {/} => returns empty array', () => {
      const urlPattern = ContentTextStub({ value: '/' });

      const result = urlSegmentsExtractTransformer({ urlPattern });

      expect(result.map(String)).toStrictEqual([]);
    });
  });

  describe('urlPattern with multiple non-param segments', () => {
    it('VALID: {/api/quests/:questId/steps/:stepId} => returns quests and steps', () => {
      const urlPattern = ContentTextStub({ value: '/api/quests/:questId/steps/:stepId' });

      const result = urlSegmentsExtractTransformer({ urlPattern });

      expect(result.map(String)).toStrictEqual(['quests', 'steps']);
    });
  });
});
