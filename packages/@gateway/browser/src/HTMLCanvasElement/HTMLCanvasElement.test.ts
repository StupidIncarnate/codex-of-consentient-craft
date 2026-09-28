import { canvasEncode } from './HTMLCanvasElement';

describe('#gateway/browser/HTMLCanvasElement', () => {
  it('VALID: {barrel} => re-exports the curated canvasEncode function', () => {
    expect(canvasEncode).toStrictEqual(expect.any(Function));
  });
});
