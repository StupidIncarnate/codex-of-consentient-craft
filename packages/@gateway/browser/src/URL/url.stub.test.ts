import { UrlStub } from './url.stub';

describe('UrlStub', () => {
  it('VALID: {} => a real URL parsed from the default href', () => {
    const url = UrlStub();

    expect({
      isUrl: url instanceof URL,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
    }).toStrictEqual({
      isUrl: true,
      hostname: 'example.com',
      pathname: '/path',
      search: '?query=1',
    });
  });

  it('VALID: {href} => a real URL parsed from the given href', () => {
    const url = UrlStub({ href: 'https://dungeonmaster.dev/guild/123' });

    expect({ hostname: url.hostname, pathname: url.pathname }).toStrictEqual({
      hostname: 'dungeonmaster.dev',
      pathname: '/guild/123',
    });
  });
});
