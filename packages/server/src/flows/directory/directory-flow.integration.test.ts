import { DirectoryFlow } from './directory-flow';

describe('DirectoryFlow', () => {
  describe('POST /api/directories/browse', () => {
    it('VALID: {empty body} => delegates to DirectoryBrowseResponder and returns 200', async () => {
      const app = DirectoryFlow();

      const response = await app.request('/api/directories/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
    });
  });
});
