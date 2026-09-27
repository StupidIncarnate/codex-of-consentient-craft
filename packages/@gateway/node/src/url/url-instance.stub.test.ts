import { UrlInstanceStub } from './url-instance.stub';

describe('UrlInstanceStub', () => {
  it('VALID: {} => parses the default href into its real components', () => {
    const url = UrlInstanceStub();

    expect({
      href: url.href,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
    }).toStrictEqual({
      href: 'https://example.com/path?x=1',
      hostname: 'example.com',
      pathname: '/path',
      search: '?x=1',
    });
  });

  it('VALID: {href} => parses the given href', () => {
    const url = UrlInstanceStub({ href: 'http://localhost:4173/api/guilds' });

    expect({ hostname: url.hostname, port: url.port, pathname: url.pathname }).toStrictEqual({
      hostname: 'localhost',
      port: '4173',
      pathname: '/api/guilds',
    });
  });
});
