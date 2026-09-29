import { setTimeout } from './setTimeout';

describe('#gateway/browser/setTimeout', () => {
  it('VALID: {barrel} => re-exports the curated setTimeout function', () => {
    expect(setTimeout).toStrictEqual(expect.any(Function));
  });
});
