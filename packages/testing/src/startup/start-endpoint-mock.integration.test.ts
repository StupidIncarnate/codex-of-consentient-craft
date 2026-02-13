import { StartEndpointMock } from './start-endpoint-mock';

const NOT_FOUND = 404;
const NO_CONTENT = 204;
const INTERNAL_SERVER_ERROR = 500;

const BASE = 'http://localhost';

const parseBody = async (response: Response): Promise<unknown> =>
  JSON.parse(JSON.stringify(await response.json())) as unknown;

describe('StartEndpointMock', () => {
  describe('listen with resolves', () => {
    it('VALID: {resolves with data} => fetch returns JSON data', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'get',
        url: `${BASE}/test/items`,
      });

      endpoint.resolves({ data: [{ id: '1' }] });

      const response = await fetch(`${BASE}/test/items`);
      const body = await parseBody(response);

      expect(body).toStrictEqual([{ id: '1' }]);
    });

    it('VALID: {resolves called twice} => second response overrides first', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'get',
        url: `${BASE}/test/override`,
      });

      endpoint.resolves({ data: { version: 1 } });
      endpoint.resolves({ data: { version: 2 } });

      const response = await fetch(`${BASE}/test/override`);
      const body = await parseBody(response);

      expect(body).toStrictEqual({ version: 2 });
    });
  });

  describe('listen with responds', () => {
    it('VALID: {responds with 404} => fetch returns error status with body', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'get',
        url: `${BASE}/test/not-found`,
      });

      endpoint.responds({ status: NOT_FOUND, body: { error: 'Not found' } });

      const response = await fetch(`${BASE}/test/not-found`);
      const body = await parseBody(response);

      expect(response.status).toBe(NOT_FOUND);
      expect(body).toStrictEqual({ error: 'Not found' });
    });

    it('VALID: {responds with 204 no body} => fetch returns empty response', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'delete',
        url: `${BASE}/test/items/1`,
      });

      endpoint.responds({ status: NO_CONTENT });

      const response = await fetch(`${BASE}/test/items/1`, { method: 'DELETE' });

      expect(response.status).toBe(NO_CONTENT);
    });
  });

  describe('listen with networkError', () => {
    it('VALID: {networkError} => fetch rejects with error', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'get',
        url: `${BASE}/test/offline`,
      });

      endpoint.networkError();

      await expect(fetch(`${BASE}/test/offline`)).rejects.toThrow(/fetch/iu);
    });
  });

  describe('default behavior', () => {
    it('VALID: {no response configured} => returns 500 with descriptive error', async () => {
      StartEndpointMock.listen({ method: 'get', url: `${BASE}/test/unconfigured` });

      const response = await fetch(`${BASE}/test/unconfigured`);
      const body = await parseBody(response);

      expect(response.status).toBe(INTERNAL_SERVER_ERROR);
      expect(body).toStrictEqual({
        error: `StartEndpointMock: No response configured for GET ${BASE}/test/unconfigured`,
      });
    });
  });

  describe('POST method', () => {
    it('VALID: {POST with resolves} => intercepts POST and returns data', async () => {
      const endpoint = StartEndpointMock.listen({
        method: 'post',
        url: `${BASE}/test/create`,
      });

      endpoint.resolves({ data: { id: 'new-123' } });

      const response = await fetch(`${BASE}/test/create`, {
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      });
      const body = await parseBody(response);

      expect(body).toStrictEqual({ id: 'new-123' });
    });
  });
});
