import { createImageBitmap } from './createImageBitmap';

describe('#gateway/browser/createImageBitmap', () => {
  it('VALID: {barrel} => re-exports the curated createImageBitmap function', () => {
    expect(createImageBitmap).toStrictEqual(expect.any(Function));
  });
});
