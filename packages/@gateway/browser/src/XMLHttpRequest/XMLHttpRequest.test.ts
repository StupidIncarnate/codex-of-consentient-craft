import { xhrPostWithProgress } from './XMLHttpRequest';

describe('#gateway/browser/XMLHttpRequest', () => {
  it('VALID: {barrel} => re-exports the curated xhrPostWithProgress function', () => {
    expect(xhrPostWithProgress).toStrictEqual(expect.any(Function));
  });
});
