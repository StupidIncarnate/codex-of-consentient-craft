import { requestAnimationFrame } from './requestAnimationFrame';

describe('#gateway/browser/requestAnimationFrame', () => {
  it('VALID: {barrel} => re-exports the curated requestAnimationFrame function', () => {
    expect(requestAnimationFrame).toStrictEqual(expect.any(Function));
  });
});
