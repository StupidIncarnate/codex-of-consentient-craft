import { HonoAppStub } from './hono-app.stub';

describe('HonoAppStub', () => {
  it('VALID: {} => a real Hono app that answers a route registered on it', async () => {
    const app = HonoAppStub();
    app.get('/ping', (c) => c.text('pong'));

    const response = await app.request('/ping');
    const body = await response.text();

    expect({ status: response.status, body }).toStrictEqual({ status: 200, body: 'pong' });
  });
});
