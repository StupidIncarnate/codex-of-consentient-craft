import { fetchJson, fetchWithStatus } from './fetch';

describe('#gateway/browser/fetch', () => {
  it('VALID: {barrel} => re-exports every curated fetch function', () => {
    expect(fetchJson).toStrictEqual(expect.any(Function));
    expect(fetchWithStatus).toStrictEqual(expect.any(Function));
  });
});
