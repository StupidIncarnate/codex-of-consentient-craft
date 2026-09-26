import { fetchJson, fetchOk } from './index';

describe('@dungeonmaster/node/fetch', () => {
  it('VALID: {barrel} => re-exports every curated fetch function', () => {
    expect(fetchJson).toStrictEqual(expect.any(Function));
    expect(fetchOk).toStrictEqual(expect.any(Function));
  });
});
