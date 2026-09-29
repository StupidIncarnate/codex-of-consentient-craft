import { HTMLImageElement } from './HTMLImageElement';

describe('#gateway/browser/HTMLImageElement', () => {
  it('VALID: {export} => is the same object the environment provides', () => {
    expect(HTMLImageElement).toBe(globalThis.HTMLImageElement);
  });
});
