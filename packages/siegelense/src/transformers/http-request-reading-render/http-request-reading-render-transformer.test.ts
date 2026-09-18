import { httpRequestReadingRenderTransformer } from './http-request-reading-render-transformer';

describe('httpRequestReadingRenderTransformer', () => {
  describe('formatting body types', () => {
    it('VALID: {object body} => formats status, statusText and JSON.stringify body', () => {
      const result = httpRequestReadingRenderTransformer({
        status: 200,
        statusText: 'OK',
        body: { id: 'guild-1', count: 5 },
      });

      expect(result).toBe('200 OK — {"id":"guild-1","count":5}');
    });

    it('VALID: {string body} => formats status, statusText and raw string body', () => {
      const result = httpRequestReadingRenderTransformer({
        status: 200,
        statusText: 'OK',
        body: 'healthy and ready',
      });

      expect(result).toBe('200 OK — healthy and ready');
    });

    it('VALID: {null body} => formats status, statusText and "null"', () => {
      const result = httpRequestReadingRenderTransformer({
        status: 204,
        statusText: 'No Content',
        body: null,
      });

      expect(result).toBe('204 No Content — null');
    });

    it('VALID: {number body} => formats status, statusText and stringified number', () => {
      const result = httpRequestReadingRenderTransformer({
        status: 200,
        statusText: 'OK',
        body: 42,
      });

      expect(result).toBe('200 OK — 42');
    });
  });

  describe('formatting error responses', () => {
    it('VALID: {404 with error object} => formats 404 Not Found with serialized error', () => {
      const result = httpRequestReadingRenderTransformer({
        status: 404,
        statusText: 'Not Found',
        body: { error: 'Guild not found' },
      });

      expect(result).toBe('404 Not Found — {"error":"Guild not found"}');
    });
  });
});
