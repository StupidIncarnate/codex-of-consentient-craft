import { setInterval } from './setInterval';

describe('#gateway/browser/setInterval', () => {
  it('VALID: {barrel} => re-exports the curated setInterval function', () => {
    expect(setInterval).toStrictEqual(expect.any(Function));
  });
});
