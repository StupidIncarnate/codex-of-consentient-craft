import { URLSearchParams } from './URLSearchParams';
import { UrlSearchParamsStub } from './url-search-params.stub';

describe('UrlSearchParamsStub', () => {
  it('VALID: {given fields} => a real URLSearchParams carrying them', () => {
    const params = UrlSearchParamsStub({ query: 'x=9' });

    expect({ isParams: params instanceof URLSearchParams, x: params.get('x') }).toStrictEqual({
      isParams: true,
      x: '9',
    });
  });

  it('VALID: {} => the documented defaults', () => {
    const params = UrlSearchParamsStub();

    expect(params.toString()).toBe('a=1&b=2');
  });
});
