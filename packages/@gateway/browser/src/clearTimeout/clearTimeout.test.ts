import { clearTimeout } from './clearTimeout';

describe('#gateway/browser/clearTimeout', () => {
  it('VALID: {barrel} => re-exports the curated clearTimeout function', () => {
    expect(clearTimeout).toStrictEqual(expect.any(Function));
  });
});
