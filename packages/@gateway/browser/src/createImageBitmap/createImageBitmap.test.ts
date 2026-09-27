import { createImageBitmap } from './createImageBitmap';

describe('#gateway/browser/createImageBitmap', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(createImageBitmap).toBe(globalThis.createImageBitmap);
  });
});
