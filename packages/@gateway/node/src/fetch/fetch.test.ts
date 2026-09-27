import { fetchJson, fetchOk, fetchWithStatus } from './fetch';

describe('#gateway/node/fetch', () => {
  it('VALID: {barrel} => re-exports every curated fetch function', () => {
    expect(fetchJson).toStrictEqual(expect.any(Function));
    expect(fetchOk).toStrictEqual(expect.any(Function));
    expect(fetchWithStatus).toStrictEqual(expect.any(Function));
  });
});
