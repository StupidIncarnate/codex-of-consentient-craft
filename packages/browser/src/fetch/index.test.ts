import { fetchJson } from './index';

describe('@dungeonmaster/browser/fetch', () => {
  it('VALID: {barrel} => re-exports every curated fetch function', () => {
    expect(fetchJson).toStrictEqual(expect.any(Function));
  });
});
