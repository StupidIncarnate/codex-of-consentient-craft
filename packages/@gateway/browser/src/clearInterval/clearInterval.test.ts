import { clearInterval } from './clearInterval';

describe('#gateway/browser/clearInterval', () => {
  it('VALID: {barrel} => re-exports the curated clearInterval function', () => {
    expect(clearInterval).toStrictEqual(expect.any(Function));
  });
});
