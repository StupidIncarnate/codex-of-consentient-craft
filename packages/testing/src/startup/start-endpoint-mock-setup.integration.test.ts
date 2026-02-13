import { http, HttpResponse } from 'msw';

import { mswServerAdapter } from '../adapters/msw/server/msw-server-adapter';

const parseBody = async (response: Response): Promise<unknown> =>
  JSON.parse(JSON.stringify(await response.json())) as unknown;

describe('StartEndpointMockSetup', () => {
  describe('MSW lifecycle', () => {
    it('VALID: {server running} => MSW intercepts registered handlers', async () => {
      const server = mswServerAdapter();

      server.use(
        http.get('http://test.local/setup-verify', () => HttpResponse.json({ active: true })),
      );

      const response = await fetch('http://test.local/setup-verify');
      const body = await parseBody(response);

      expect(body).toStrictEqual({ active: true });
    });

    it('VALID: {new handler after reset} => fresh handler works after previous test cleanup', async () => {
      const server = mswServerAdapter();

      server.use(
        http.get('http://test.local/setup-fresh', () => HttpResponse.json({ freshHandler: true })),
      );

      const response = await fetch('http://test.local/setup-fresh');
      const body = await parseBody(response);

      expect(body).toStrictEqual({ freshHandler: true });
    });
  });
});
