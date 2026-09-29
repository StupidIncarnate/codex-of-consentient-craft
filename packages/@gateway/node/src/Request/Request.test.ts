import { Request } from './Request';

describe('#gateway/node/Request', () => {
  it('VALID: {export} => is the Request class Node provides', () => {
    expect(Request.name).toBe('Request');
  });

  it('VALID: {url, method} => a request carrying that url and method', () => {
    const request = new Request('http://localhost/api/guilds', { method: 'POST', body: 'x' });

    expect({ url: request.url, method: request.method }).toStrictEqual({
      url: 'http://localhost/api/guilds',
      method: 'POST',
    });
  });
});
