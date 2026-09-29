import { RequestStub } from './request.stub';

describe('RequestStub', () => {
  it('VALID: {} => a GET request to the default url', () => {
    const request = RequestStub();

    expect({ url: request.url, method: request.method }).toStrictEqual({
      url: 'http://localhost/api/test',
      method: 'GET',
    });
  });

  it('VALID: {url, method, body} => a request carrying all three', async () => {
    const request = RequestStub({
      url: 'http://localhost/api/guilds',
      method: 'POST',
      body: '{"name":"g"}',
    });

    expect({ url: request.url, method: request.method, body: await request.text() }).toStrictEqual({
      url: 'http://localhost/api/guilds',
      method: 'POST',
      body: '{"name":"g"}',
    });
  });
});
